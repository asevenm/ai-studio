'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ImageSet {
  id: string;
  name: string;
  configType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  images: { id: string; url: string; thumbnail?: string }[];
}

interface SSEEvent {
  type: 'connected' | 'update' | 'all_completed';
  imageSets?: ImageSet[];
}

interface UseImageSetStreamOptions {
  enabled: boolean;
  onUpdate: (imageSets: ImageSet[]) => void;
  onAllCompleted?: () => void;
}

export function useImageSetStream({ enabled, onUpdate, onAllCompleted }: UseImageSetStreamOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/image-sets/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'connected':
            console.log('[SSE] Connected to image set stream');
            break;
          case 'update':
            if (data.imageSets) {
              onUpdate(data.imageSets);
            }
            break;
          case 'all_completed':
            console.log('[SSE] All image sets completed');
            onAllCompleted?.();
            break;
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error);
      }
    };

    eventSource.onerror = () => {
      console.log('[SSE] Connection error, will reconnect...');
      eventSource.close();
      eventSourceRef.current = null;

      // Reconnect after 3 seconds
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [enabled, onUpdate, onAllCompleted]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return { disconnect };
}

