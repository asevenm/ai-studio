import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET /api/image-sets/[id] - Get single image set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const imageSet = await prisma.imageSet.findUnique({
      where: { id },
      include: {
        images: true,
        sourceImages: true,
      },
    });

    if (!imageSet) {
      return NextResponse.json({ error: 'Image set not found' }, { status: 404 });
    }

    return NextResponse.json(imageSet);
  } catch (error) {
    console.error('Error fetching image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/image-sets/[id] - Delete image set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.imageSet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
