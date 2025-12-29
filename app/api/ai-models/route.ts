import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ai-models - Get available AI models
export async function GET() {
  try {
    const models = await prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' },
    });

    // If no models exist, return default models
    if (models.length === 0) {
      return NextResponse.json([
        { id: 'nano-banana', name: 'Nano Banana', description: '极致速度', pointsCost: 10 },
        { id: 'pro-mango', name: 'Pro Mango', description: '高质量', pointsCost: 25 },
      ]);
    }

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
