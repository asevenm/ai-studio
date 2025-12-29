import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductCredits } from "@/lib/credits";
import { generateBackground } from "@/lib/doubao";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, platform } = await request.json();

    if (!prompt) {
        return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // Call Doubao API via lib
    const imageUrl = await generateBackground({ prompt, platform });

    if (!imageUrl) {
        throw new Error('No image URL in response');
    }

    // Success! Deduct credit
    await deductCredits(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        background_url: imageUrl
      }
    });

  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Generation Failed' }, { status: 500 });
  }
}

