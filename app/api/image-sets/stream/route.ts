import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// SSE endpoint to stream image set status updates
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection event
      sendEvent({ type: 'connected' });

      // Check for updates periodically (server-side, more efficient than client polling)
      let lastUpdateTime = new Date();
      const checkInterval = setInterval(async () => {
        try {
          // Check for any image sets that were updated since last check
          const updatedSets = await prisma.imageSet.findMany({
            where: {
              userId: user.id,
              updatedAt: { gt: lastUpdateTime },
            },
            include: {
              images: true,
              sourceImages: true,
            },
            orderBy: { updatedAt: 'desc' },
          });

          if (updatedSets.length > 0) {
            lastUpdateTime = new Date();
            sendEvent({
              type: 'update',
              imageSets: updatedSets,
            });
          }

          // Check if there are still processing items
          const processingCount = await prisma.imageSet.count({
            where: {
              userId: user.id,
              status: 'processing',
            },
          });

          // If no more processing items, send complete event
          if (processingCount === 0) {
            sendEvent({ type: 'all_completed' });
          }
        } catch (error) {
          console.error('SSE check error:', error);
        }
      }, 2000); // Check every 2 seconds on server side

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(checkInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

