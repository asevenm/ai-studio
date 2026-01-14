import OpenAI from 'openai';

// Initialize OpenAI client for Aliyun DashScope API (Qwen2-VL)
const dashscopeClient = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

export interface AnalyzeProductImagesOptions {
  images: string[];       // base64 data URI 图片数组
  configType: string;     // 配置类型（3C数码标准配置/服装标准配置）
  extraPrompt?: string;   // 用户额外提示词
}

// 不同配置类型的分析指令模板
const analysisPrompts: Record<string, string> = {
  '3C数码标准配置': `请仔细分析这些3C数码产品图片，识别以下信息：
1. 产品类型（如：手机、耳机、充电器、智能手表、平板电脑等）
2. 产品颜色（主色调、辅助色）
3. 材质和质感（金属、塑料、玻璃、皮革等）
4. 产品形状和尺寸特征
5. 设计风格（圆润、方正、极简等）
6. 品牌标识或Logo（如有）
7. 产品功能特点和亮点

基于以上分析，请生成一个详细的产品展示图生成 Prompt，要求：
- 必须准确描述产品的外观特征，确保生成图片中产品外观的一致性
- 突出产品的核心设计特征和卖点
- 适合电商平台（淘宝、京东、亚马逊等）的产品展示
- 现代简约风格，突出高级质感
- 生成多角度产品展示图、场景应用图

请直接输出优化后的 Prompt，不需要其他解释。`,

  '服装标准配置': `请仔细分析这些服装产品图片，识别以下信息：
1. 服装类型（如：T恤、衬衫、连衣裙、外套、裤子等）
2. 颜色和图案（纯色、条纹、印花等）
3. 材质和质感（棉、丝绸、牛仔、羊毛等）
4. 款式特点（版型、领口、袖长、下摆等）
5. 设计细节（纽扣、拉链、口袋、装饰等）
6. 品牌标识或Logo（如有）
7. 适合的穿着场景和目标人群

基于以上分析，请生成一个详细的服装展示图生成 Prompt，要求：
- 必须准确描述服装的外观特征，确保生成图片中服装外观的一致性
- 突出服装的核心设计特征和卖点
- 适合电商平台的服装展示
- 时尚现代风格
- 生成模特穿搭展示、细节特写、搭配建议等

请直接输出优化后的 Prompt，不需要其他解释。`,
};

/**
 * 使用 Qwen2-VL Vision API 分析商品图片并生成优化后的 Prompt
 * @param options 分析选项
 * @returns 优化后的 Prompt 字符串
 */
export async function analyzeProductImages(
  options: AnalyzeProductImagesOptions
): Promise<string> {
  const { images, configType, extraPrompt } = options;

  if (images.length === 0) {
    throw new Error('至少需要提供一张商品图片进行分析');
  }

  // 获取对应配置类型的分析指令
  const baseAnalysisPrompt = analysisPrompts[configType] || analysisPrompts['3C数码标准配置'];

  // 如果用户提供了额外提示词，添加到分析指令中
  let analysisPrompt = baseAnalysisPrompt;
  if (extraPrompt) {
    analysisPrompt += `\n\n用户额外要求：${extraPrompt}\n请在生成的 Prompt 中融入用户的这些要求。`;
  }

  // 构建多模态消息内容（Qwen2-VL 要求图片在前，文本在后）
  const messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    // 添加所有图片
    ...images.map((img) => ({
      type: 'image_url' as const,
      image_url: {
        url: img, // base64 data URI
      },
    })),
    {
      type: 'text',
      text: analysisPrompt,
    },
  ];

  try {
    const response = await dashscopeClient.chat.completions.create({
      model: process.env.VISION_MODEL_ID || 'qwen2-vl-72b-instruct',
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedPrompt = response.choices[0]?.message?.content;

    if (!generatedPrompt) {
      throw new Error('Vision API 未返回有效的分析结果');
    }

    console.log('[Vision] 图片分析完成，生成 Prompt 长度:', generatedPrompt.length);
    return generatedPrompt.trim();
  } catch (error) {
    console.error('[Vision] 图片分析失败:', error);
    throw error;
  }
}

/**
 * 带回退机制的图片分析函数
 * 分析失败时返回默认 Prompt，不阻塞主流程
 */
export async function analyzeProductImagesWithFallback(
  options: AnalyzeProductImagesOptions,
  fallbackPrompt: string
): Promise<{ prompt: string; analyzed: boolean }> {
  try {
    const analyzedPrompt = await analyzeProductImages(options);
    return { prompt: analyzedPrompt, analyzed: true };
  } catch (error) {
    console.error('[Vision] 分析失败，使用默认 Prompt:', error);
    // 如果有用户额外提示词，附加到默认 Prompt
    const finalPrompt = options.extraPrompt
      ? `${fallbackPrompt}。${options.extraPrompt}`
      : fallbackPrompt;
    return { prompt: finalPrompt, analyzed: false };
  }
}
