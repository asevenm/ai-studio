'use client';

import { useStore } from '@/store/useStore';
import { Layers, Image as ImageIcon, Type, Square, LayoutTemplate } from 'lucide-react';

export default function SidebarLeft() {
  const { layers, selectedId, selectLayer } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={14} />;
      case 'product': return <ImageIcon size={14} />;
      case 'background': return <LayoutTemplate size={14} />;
      default: return <Square size={14} />;
    }
  };

  return (
    <div className="w-[240px] h-full bg-white border-r border-gray-200 flex flex-col z-20">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-sm flex items-center gap-2">
            <Layers size={16} /> Layers
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {layers.slice().reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm mb-1 ${
              selectedId === layer.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="text-gray-400">{getIcon(layer.type)}</span>
            <span className="truncate w-full">
                {layer.type === 'text' ? (layer.text || 'Text Layer') : `${layer.type} Layer`}
            </span>
          </div>
        ))}
        {layers.length === 0 && (
            <div className="text-xs text-gray-400 text-center mt-10">
                No layers yet.
            </div>
        )}
      </div>
    </div>
  );
}
