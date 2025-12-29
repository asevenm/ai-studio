import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetLanguage, targetPlatform } = await request.json();

    const sourceFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        designs: true,
        project: true
      }
    });

    if (!sourceFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (sourceFolder.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create new folder
    const newFolder = await prisma.folder.create({
      data: {
        name: `${targetPlatform}-${targetLanguage}`,
        platform: targetPlatform,
        language: targetLanguage,
        projectId: sourceFolder.projectId,
        designs: {
          create: sourceFolder.designs.map(design => ({
            name: `${design.name} (${targetLanguage})`,
            sceneJson: design.sceneJson as any
          }))
        }
      },
      include: {
        designs: true
      }
    });

    // TODO: Implement translation logic for text layers in sceneJson if needed

    return NextResponse.json(newFolder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
