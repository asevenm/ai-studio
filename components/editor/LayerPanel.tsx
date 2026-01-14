'use client';

import { useState } from 'react';
import { Eye, EyeOff, Layers, Images, Plus } from 'lucide-react';
import { useStore, GeneratedImage } from '@/store/useStore';
import Image from 'next/image';

export default function LayerPanel() {
  const { layers, selectedId, selectLayer, updateLayer, imageSet, addImageToCanvas, saveHistory } = useStore();
  const [activeTab, setActiveTab] = useState<'layers' | 'images'>('images');

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

  const handleAddImage = (image: GeneratedImage) => {
    addImageToCanvas(image);
    saveHistory();
  };

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'images'
              ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('images')}
        >
          <Images className="w-4 h-4" />
          套图素材
        </button>
        <button
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'layers'
              ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('layers')}
        >
          <Layers className="w-4 h-4" />
          图层
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'images' ? (
          <div className="p-3">
            {imageSet ? (
              <div className="space-y-4">
                {/* Image Set Info */}
                <div className="text-xs text-gray-500 px-1">
                  {imageSet.name} · {imageSet.images.length} 张图片
                </div>

                {/* Source Images Section */}
                {imageSet.sourceImages.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2 px-1">原始素材</div>
                    <div className="grid grid-cols-2 gap-2">
                      {imageSet.sourceImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-pointer hover:border-orange-300 transition-colors"
                          onClick={() => handleAddImage({ id: img.id, url: img.url, thumbnail: null, platform: null })}
                        >
                          <Image
                            src={img.url}
                            alt={img.viewType}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                            <span className="text-xs text-white">{img.viewType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generated Images Section */}
                {imageSet.images.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2 px-1">生成图片</div>
                    <div className="grid grid-cols-2 gap-2">
                      {imageSet.images.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-pointer hover:border-orange-300 transition-colors"
                          onClick={() => handleAddImage(img)}
                        >
                          <Image
                            src={img.thumbnail || img.url}
                            alt="Generated"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {img.platform && (
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                              {img.platform}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {imageSet.status === 'processing' && (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-500">正在生成图片...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-8">
                <Images className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>暂无关联套图</p>
                <p className="text-xs mt-1">请先选择商品套图</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
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
        )}
      </div>
    </div>
  );
}
