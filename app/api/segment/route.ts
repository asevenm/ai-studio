import { NextResponse } from 'next/server';
import { visualService } from '@/lib/volcengine';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductCredits } from "@/lib/credits";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!process.env.VOLC_ACCESSKEY || !process.env.VOLC_SECRETKEY) {
      console.error('Missing Volcengine API Keys');
      return NextResponse.json({ success: false, error: 'Server configuration error: Missing API Keys' }, { status: 500 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Convert File to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // Call Volcengine Visual API
    const response = await visualService.cvProcess('EntitySegment', {
      req_key: 'entity_seg',
      binary_data_base64: [base64Image],
      return_format: 1,
      refine_mask: 1,
    }, '2024-06-06');

    // ... existing response processing logic ...
    // (I'll keep the processing logic but wrap the credit deduction around it)
    
    if (response.ResponseMetadata && response.ResponseMetadata.Error) {
      throw new Error(`Volcengine API Error: ${response.ResponseMetadata.Error.Message}`);
    }

    let responseData = response.Result?.data ?? response.data;
    const results = responseData?.binary_data_base64 || responseData?.results;
    const resultBase64 = Array.isArray(results) ? results[0] : (responseData?.image || responseData?.foreground_image);

    if (!resultBase64) {
      throw new Error('No image data found in response');
    }

    // Success! Deduct credit
    await deductCredits(session.user.id);

    const segmentedUrl = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({
      success: true,
      data: {
        segmented_url: segmentedUrl
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Segmentation Failed'
    }, { status: 500 });
  }
}