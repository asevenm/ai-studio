import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/image-sets - Get user's image sets
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

    const imageSets = await prisma.imageSet.findMany({
      where: { userId: user.id },
      include: {
        images: true,
        sourceImages: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(imageSets);
  } catch (error) {
    console.error('Error fetching image sets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/image-sets - Create new image set
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
    const { configType, extraPrompt, modelId, sourceImages } = body;

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

    // Create image set
    const imageSet = await prisma.imageSet.create({
      data: {
        name,
        configType,
        extraPrompt,
        modelId,
        pointsCost,
        userId: user.id,
        sourceImages: {
          create: sourceImages.map((img: { url: string; viewType: string }) => ({
            url: img.url,
            viewType: img.viewType,
          })),
        },
      },
      include: {
        images: true,
        sourceImages: true,
      },
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: user.credits - pointsCost },
    });

    // TODO: Trigger AI generation job here

    return NextResponse.json(imageSet);
  } catch (error) {
    console.error('Error creating image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
