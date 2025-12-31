import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize OpenAI client for Volcengine ARK API
const arkClient = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.ARK_API_KEY,
});

// GET /api/image-sets - Get user's image sets
export async function GET(_request: NextRequest) {
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

// Helper function to save base64 image to disk
async function saveBase64Image(base64Data: string, imageSetId: string, index: number): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'generated');
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `${imageSetId}_${index}_${timestamp}.png`;
  const filepath = path.join(uploadsDir, filename);
  
  // Decode base64 and save
  const imageBuffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, imageBuffer);
  
  // Return the public URL path
  return `/uploads/generated/${filename}`;
}

// Background task to generate images (runs after response is sent)
async function generateImagesInBackground(
  imageSetId: string,
  userId: string,
  userCredits: number,
  prompt: string,
  maxImages: number,
  image?: string[],
) {
  try {
    // Call Doubao Seedream API with streaming using OpenAI SDK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagesResponse = await (arkClient.images.generate as any)({
      model: process.env.SEEDREAM_MODEL_ID || 'doubao-seedream-4-5-251128',
      prompt,
      image,
      size: '2K',
      response_format: 'b64_json',
      stream: true,
        watermark: false,
        sequential_image_generation: 'auto',
        sequential_image_generation_options: {
          max_images: maxImages,
        },
      // extra_body: {
      //   watermark: false,
      //   sequential_image_generation: 'auto',
      //   sequential_image_generation_options: {
      //     max_images: maxImages,
      //   },
      // },
    });

    let imageIndex = 0;

    // Handle streaming response from Volcengine ARK API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const event of imagesResponse as AsyncIterable<any>) {
      if (event === null) continue;

      if (event.type === 'image_generation.partial_succeeded') {
        if (event.b64_json) {
          console.log(`[Background] Received image ${imageIndex + 1}, size=${event.b64_json.length}`);
          
          // Save image to disk
          const imageUrl = await saveBase64Image(event.b64_json, imageSetId, imageIndex);

          // Create GeneratedImage record
          await prisma.generatedImage.create({
            data: {
              url: imageUrl,
              imageSetId: imageSetId,
            },
          });

          imageIndex++;
        }
      } else if (event.type === 'image_generation.completed') {
        console.log('[Background] Image generation completed');
        if (event.usage) {
          console.log('[Background] Usage:', event.usage);
        }
      }
    }

    // Update image set status to completed
    await prisma.imageSet.update({
      where: { id: imageSetId },
      data: { status: 'completed' },
    });

    console.log(`[Background] ImageSet ${imageSetId} completed with ${imageIndex} images`);
  } catch (genError) {
    console.error('[Background] Error generating images:', genError);
    
    // Update status to failed
    await prisma.imageSet.update({
      where: { id: imageSetId },
      data: { status: 'failed' },
    });

    // Refund credits on failure
    await prisma.user.update({
      where: { id: userId },
      data: { credits: userCredits },
    });
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

    // Build the prompt for Seedream from form data
    const defaultPrompts: Record<string, string> = {
      '3C数码标准配置': '参考这个产品图，生成一组3C数码产品展示图，包括多角度产品展示、场景应用图等，返回4张图片。现代简约风格，高级感',
      '服装标准配置': '参考这个产品图，生成一组服装产品展示图，包括模特穿搭展示、细节特写、搭配建议等。时尚现代风格',
    };
    const basePrompt = defaultPrompts[configType] || defaultPrompts['3C数码标准配置'];
    const prompt = extraPrompt ? `${basePrompt}。${extraPrompt}` : basePrompt;

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
    generateImagesInBackground(
      imageSet.id,
      user.id,
      user.credits, // Original credits for refund if failed
      prompt,
      maxImages,
      referenceImages,
    ).catch(err => {
      console.error('[Background] Unhandled error in background generation:', err);
    });

    // Return immediately with processing status
    return NextResponse.json(imageSet);
  } catch (error) {
    console.error('Error creating image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
