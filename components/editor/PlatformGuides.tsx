import React from 'react';
import { Rect, Group, Line, Text } from 'react-konva';
import { useStore } from '@/store/useStore';

export default function PlatformGuides() {
  const { platform } = useStore();

  if (!platform) return null;

  if (platform === 'TikTok') {
    // 9:16 aspect ratio guide
    const canvasWidth = 800; // Assuming fixed base canvas for calculation
    const canvasHeight = 600;
    const guideWidth = (canvasHeight * 9) / 16;
    const x = (canvasWidth - guideWidth) / 2;

    return (
      <Group listening={false}>
        {/* Safe Area */}
        <Rect
          x={x}
          y={0}
          width={guideWidth}
          height={canvasHeight}
          stroke="#ff0050"
          strokeWidth={2}
          dash={[10, 5]}
          opacity={0.5}
        />
        <Text
          x={x + 5}
          y={5}
          text="TikTok 9:16 Safe Area"
          fontSize={12}
          fill="#ff0050"
          opacity={0.7}
        />
      </Group>
    );
  }

  if (platform === 'Amazon') {
    // 1:1 aspect ratio guide
    const canvasWidth = 800;
    const canvasHeight = 600;
    const size = Math.min(canvasWidth, canvasHeight) * 0.9;
    const x = (canvasWidth - size) / 2;
    const y = (canvasHeight - size) / 2;

    return (
      <Group listening={false}>
        <Rect
          x={x}
          y={y}
          width={size}
          height={size}
          stroke="#ff9900"
          strokeWidth={2}
          dash={[10, 5]}
          opacity={0.5}
        />
        <Text
          x={x + 5}
          y={y + 5}
          text="Amazon 1:1 Main Image Guide"
          fontSize={12}
          fill="#ff9900"
          opacity={0.7}
        />
      </Group>
    );
  }

  return null;
}
