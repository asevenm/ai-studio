import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST /api/image-sets/[id]/design - Create a design from an image set
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the image set
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

    // Verify ownership
    if (imageSet.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get optional parameters from request body
    const body = await request.json().catch(() => ({}));
    const { platform = 'taobao', designName } = body;

    // Create or get project
    let project = await prisma.project.findFirst({
      where: { userId: user.id },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Default Project',
          userId: user.id,
        },
      });
    }

    // Create or get folder for this platform
    let folder = await prisma.folder.findFirst({
      where: {
        projectId: project.id,
        platform: platform,
      },
    });

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: platform,
          platform: platform,
          projectId: project.id,
        },
      });
    }

    // Build initial scene with images from the image set
    const layers: any[] = [];
    let zIndex = 0;

    // Add source images as product layers
    imageSet.sourceImages.forEach((img, index) => {
      layers.push({
        id: `source-${img.id}`,
        type: 'product',
        x: 100 + index * 50,
        y: 100 + index * 50,
        width: 400,
        height: 400,
        rotation: 0,
        src: img.url,
        zIndex: zIndex++,
      });
    });

    // Add generated images as product layers
    imageSet.images.forEach((img, index) => {
      layers.push({
        id: `generated-${img.id}`,
        type: 'product',
        x: 150 + index * 50,
        y: 150 + index * 50,
        width: 400,
        height: 400,
        rotation: 0,
        src: img.url,
        zIndex: zIndex++,
      });
    });

    const sceneJson: Prisma.InputJsonValue = { layers };

    // Create design linked to image set
    const design = await prisma.design.create({
      data: {
        name: designName || `${imageSet.name} - 设计`,
        sceneJson,
        folderId: folder.id,
        imageSetId: imageSet.id,
      },
      include: {
        folder: {
          include: {
            project: true,
          },
        },
        imageSet: {
          include: {
            images: true,
            sourceImages: true,
          },
        },
      },
    });

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error creating design from image set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
