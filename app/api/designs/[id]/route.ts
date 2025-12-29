import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        folder: {
          include: {
            project: true
          }
        }
      }
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Check ownership
    if (design.folder.project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sceneJson, name } = await request.json();

    const design = await prisma.design.findUnique({
      where: { id },
      include: {
        folder: {
          include: {
            project: true
          }
        }
      }
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Check ownership
    if (design.folder.project.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedDesign = await prisma.design.update({
      where: { id },
      data: {
        ...(sceneJson && { sceneJson }),
        ...(name && { name })
      }
    });

    return NextResponse.json(updatedDesign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}