export interface DoubaoGenerateOptions {
  prompt: string;
  platform?: string;
  size?: string;
}

export async function generateBackground({ prompt, platform, size = "1024x1024" }: DoubaoGenerateOptions) {
  const endpoint = process.env.DOUBAO_API_ENDPOINT;
  const modelId = process.env.DOUBAO_MODEL_ID;
  const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLC_ACCESSKEY;

  if (!endpoint || !modelId || !apiKey) {
    throw new Error('Missing Doubao/Ark API configuration');
  }

  // Inject platform-specific constraints
  let finalPrompt = prompt;
  if (platform === 'Amazon') {
    finalPrompt = `${prompt}, pure white background, high quality product photography, e-commerce style, clean composition`;
  } else if (platform === 'TikTok') {
    finalPrompt = `${prompt}, lifestyle setting, trendy, vibrant colors, social media style, high resolution`;
  }

  const response = await fetch(`${endpoint}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      prompt: finalPrompt,
      n: 1,
      size,
      response_format: "url"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ark API Failed: ${errorText}`);
  }

  const data = await response.json();
  return data.data?.[0]?.url;
}

export async function generateCopy({ projectInfo, platform }: { projectInfo: any, platform: string | null }) {
  const endpoint = process.env.DOUBAO_API_ENDPOINT;
  const modelId = process.env.DOUBAO_CHAT_MODEL_ID; // Use a chat model
  const apiKey = process.env.DOUBAO_API_KEY || process.env.VOLC_ACCESSKEY;

  if (!endpoint || !modelId || !apiKey) {
    throw new Error('Missing Doubao/Ark Chat API configuration');
  }

  const prompt = `Generate a short, catchy e-commerce headline and description for the following product:
  Product Name: ${projectInfo.name}
  Base Info: ${JSON.stringify(projectInfo.baseInfo)}
  Platform: ${platform || 'General'}
  
  Return the result in JSON format: { "headline": "...", "description": "..." }`;

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: "You are an expert e-commerce copywriter." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ark Chat API Failed: ${errorText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  return content;
}
