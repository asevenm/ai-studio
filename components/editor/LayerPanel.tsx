'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function LayerPanel() {
  const { layers, selectedId, selectLayer, updateLayer } = useStore();

  const getLayerDisplayName = (layer: typeof layers[0]) => {
    switch (layer.type) {
      case 'text':
        return layer.text?.slice(0, 10) || '卖点文字';
      case 'product':
        return '核心商品';
      case 'background':
        return '场景背景';
      default:
        return '图层';
    }
  };

  // Sort layers by zIndex in reverse for display (top layers first)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-60 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-medium text-gray-900">图层管理</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sortedLayers.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            暂无图层
          </div>
        ) : (
          <div className="space-y-1">
            {sortedLayers.map((layer) => {
              const isVisible = (layer as any).visible !== false;

              return (
                <div
                  key={layer.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedId === layer.id
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectLayer(layer.id)}
                >
                  <button
                    className={`flex-shrink-0 ${
                      isVisible ? 'text-gray-400' : 'text-gray-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !isVisible } as any);
                    }}
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={`text-sm truncate ${
                      selectedId === layer.id
                        ? 'text-orange-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {getLayerDisplayName(layer)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
