import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { generateImagesInBackground } from '@/lib/image-generation';

// GET /api/image-sets - Get user's image sets with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const keyword = searchParams.get('keyword') || '';

    const skip = (page - 1) * limit;

    // Build where clause with optional keyword search
    const where: any = { userId: user.id };
    if (keyword) {
      where.name = { contains: keyword };
    }

    // Get total count for pagination info
    const total = await prisma.imageSet.count({ where });

    const imageSets = await prisma.imageSet.findMany({
      where,
      include: {
        images: true,
        sourceImages: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: imageSets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + imageSets.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching image sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/image-sets - Create new image set with Seedream generation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { configType, extraPrompt, modelId, sourceImages, maxImages = 4 } = body;

    // Generate a sequential name
    const count = await prisma.imageSet.count({
      where: { userId: user.id },
    });
    const name = `运动系列套图 #${new Date().getFullYear()}${String(count + 1).padStart(3, '0')}`;

    // Get model points cost
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId },
    });
    const pointsCost = model?.pointsCost || 10;

    // Check user credits
    if (user.credits < pointsCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // Create image set with processing status
    const imageSet = await prisma.imageSet.create({
      data: {
        name,
        configType,
        extraPrompt,
        modelId,
        pointsCost,
        status: 'processing',
        userId: user.id,
        sourceImages: {
          create: sourceImages?.map((img: { url: string; viewType: string }) => ({
            url: img.url,
            viewType: img.viewType,
          })) || [],
        },
      },
      include: {
        images: true,
        sourceImages: true,
      },
    });

    // Deduct credits immediately
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits - pointsCost },
    });

    // Get reference images from uploaded sourceImages
    // Convert local images to base64 data URIs for API access
    const referenceImages: string[] = [];
    for (const img of sourceImages || []) {
      if (img.url.startsWith('/')) {
        // Local file - read and convert to base64
        const localPath = path.join(process.cwd(), 'public', img.url);
        if (fs.existsSync(localPath)) {
          const imageBuffer = fs.readFileSync(localPath);
          const base64Data = imageBuffer.toString('base64');
          // Detect image type from extension
          const ext = path.extname(img.url).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' :
            ext === '.gif' ? 'image/gif' :
              ext === '.webp' ? 'image/webp' : 'image/jpeg';
          referenceImages.push(`data:${mimeType};base64,${base64Data}`);
        }
      } else {
        // External URL - use as-is
        referenceImages.push(img.url);
      }
    }

    if (referenceImages.length === 0) {
      return NextResponse.json({ error: '请上传至少一张参考图片' }, { status: 400 });
    }

    // Start background generation (don't await - let it run in background)
    // Vision 分析将在后台任务中执行
    generateImagesInBackground({
      imageSetId: imageSet.id,
      userId: user.id,
      userCredits: user.credits,
      configType,
      extraPrompt,
      maxImages,
      referenceImages,
    }).catch(err => {
      console.error('[Background] Unhandled error in background generation:', err);
    });

    // Return immediately with processing status
    return NextResponse.json(imageSet);
  } catch (error) {
    console.error('Error creating image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
