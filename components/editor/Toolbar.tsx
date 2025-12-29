'use client';

import { MousePointer2, Image, Type } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tools = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'image', icon: Image, label: '图片' },
  { id: 'text', icon: Type, label: '文字' },
] as const;

export default function Toolbar() {
  const { activeTool, setActiveTool } = useStore();

  return (
    <div className="w-14 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id || (tool.id === 'image' && activeTool === 'shape');

        return (
          <button
            key={tool.id}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-orange-50 text-orange-500'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTool(tool.id === 'image' ? 'shape' : tool.id as any)}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
