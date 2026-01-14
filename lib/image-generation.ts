import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { analyzeProductImagesWithFallback } from '@/lib/vision';

// Initialize OpenAI client for Volcengine ARK API
const arkClient = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.ARK_API_KEY,
});

// 默认 Prompt 模板
const defaultPrompts: Record<string, string> = {
  '3C数码标准配置': '参考这个产品图，生成一组3C数码产品展示图，包括多角度产品展示、场景应用图等，返回4张图片。现代简约风格，高级感',
  '服装标准配置': '参考这个产品图，生成一组服装产品展示图，包括模特穿搭展示、细节特写、搭配建议等。时尚现代风格',
};

/**
 * 保存 base64 图片到磁盘
 */
async function saveBase64Image(
  base64Data: string,
  imageSetId: string,
  index: number
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'generated');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `${imageSetId}_${index}_${timestamp}.png`;
  const filepath = path.join(uploadsDir, filename);

  const imageBuffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filepath, imageBuffer);

  return `/uploads/generated/${filename}`;
}

export interface GenerateImagesOptions {
  imageSetId: string;
  userId: string;
  userCredits: number;
  configType: string;
  extraPrompt?: string;
  maxImages: number;
  referenceImages: string[];
}

/**
 * 后台图片生成任务
 * 1. 使用 Vision API 分析商品图片生成优化 Prompt
 * 2. 调用 Seedream 生成图片
 */
export async function generateImagesInBackground(
  options: GenerateImagesOptions
): Promise<void> {
  const {
    imageSetId,
    userId,
    userCredits,
    configType,
    extraPrompt,
    maxImages,
    referenceImages,
  } = options;

  try {
    // Step 1: 使用 Vision API 分析商品图片，生成优化后的 Prompt
    const fallbackPrompt = defaultPrompts[configType] || defaultPrompts['3C数码标准配置'];

    console.log('[Background] 开始 Vision 分析图片...');
    const { prompt, analyzed } = await analyzeProductImagesWithFallback(
      {
        images: referenceImages,
        configType,
        extraPrompt,
      },
      fallbackPrompt
    );
    console.log(
      `[Background] Prompt 生成完成 (Vision分析: ${analyzed}):`,
      prompt.substring(0, 100) + '...'
    );

    // 更新 ImageSet 记录分析生成的 Prompt
    await prisma.imageSet.update({
      where: { id: imageSetId },
      data: { analyzedPrompt: prompt },
    });

    // Step 2: Call Doubao Seedream API with streaming
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagesResponse = await (arkClient.images.generate as any)({
      model: process.env.SEEDREAM_MODEL_ID || 'doubao-seedream-4-5-251128',
      prompt,
      image: referenceImages,
      size: '2K',
      response_format: 'b64_json',
      stream: true,
      watermark: false,
      sequential_image_generation: 'auto',
      sequential_image_generation_options: {
        max_images: maxImages,
      },
    });

    let imageIndex = 0;

    // Handle streaming response from Volcengine ARK API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const event of imagesResponse as AsyncIterable<any>) {
      if (event === null) continue;

      if (event.type === 'image_generation.partial_succeeded') {
        if (event.b64_json) {
          console.log(
            `[Background] Received image ${imageIndex + 1}, size=${event.b64_json.length}`
          );

          const imageUrl = await saveBase64Image(event.b64_json, imageSetId, imageIndex);

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
