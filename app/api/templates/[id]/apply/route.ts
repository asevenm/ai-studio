import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST /api/templates/[id]/apply - Apply template to create new design
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

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Create a new project for the design if not exists
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

    // Create a new folder for the template platform
    let folder = await prisma.folder.findFirst({
      where: {
        projectId: project.id,
        platform: template.platform,
      },
    });

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: template.platform,
          platform: template.platform,
          projectId: project.id,
        },
      });
    }

    // Create new design with template scene
    const design = await prisma.design.create({
      data: {
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        sceneJson: template.sceneJson as Prisma.InputJsonValue,
        folderId: folder.id,
      },
    });

    return NextResponse.json({ designId: design.id });
  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
