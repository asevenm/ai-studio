import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deductCredits } from "@/lib/credits";
import { generateCopy } from "@/lib/doubao";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectInfo, platform } = await request.json();

    if (!projectInfo) {
        return NextResponse.json({ success: false, error: 'Project info is required' }, { status: 400 });
    }

    // Call Doubao API via lib
    const copy = await generateCopy({ projectInfo, platform });

    // Success! Deduct credit
    await deductCredits(session.user.id);

    return NextResponse.json({
      success: true,
      data: copy
    });

  } catch (error: any) {
    console.error('Copy Generation Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Copy Generation Failed' }, { status: 500 });
  }
}
