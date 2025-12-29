import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

// GET /api/image-sets/[id]/download - Download all images as zip
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
      },
    });

    if (!imageSet) {
      return NextResponse.json({ error: 'Image set not found' }, { status: 404 });
    }

    if (imageSet.images.length === 0) {
      return NextResponse.json({ error: 'No images to download' }, { status: 400 });
    }

    // Create zip file
    const zip = new JSZip();

    for (let i = 0; i < imageSet.images.length; i++) {
      const image = imageSet.images[i];
      try {
        const response = await fetch(image.url);
        const buffer = await response.arrayBuffer();
        const extension = image.url.split('.').pop() || 'jpg';
        zip.file(`image_${i + 1}.${extension}`, buffer);
      } catch (error) {
        console.error(`Failed to fetch image ${image.url}:`, error);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${imageSet.name}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error downloading image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
