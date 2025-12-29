import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile } from 'fs/promises';
import path from 'path';

// POST /api/upload - Upload images
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const viewTypes = formData.getAll('viewTypes') as string[];

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const uploadedFiles: { url: string; viewType: string }[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const viewType = viewTypes[i] || 'unknown';

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = image.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${randomStr}.${extension}`;

      // Save to public/uploads
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filepath = path.join(uploadDir, filename);

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        url: `/uploads/${filename}`,
        viewType,
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
