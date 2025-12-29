'use client';

import { ChevronUp, ChevronDown, Copy, Layers, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function FloatingActions() {
  const { selectedId, layers, updateLayer, addLayer, saveHistory } = useStore();

  if (!selectedId) return null;

  const selectedLayer = layers.find((l) => l.id === selectedId);
  if (!selectedLayer) return null;

  const handleMoveUp = () => {
    const maxZIndex = Math.max(...layers.map((l) => l.zIndex));
    if (selectedLayer.zIndex < maxZIndex) {
      updateLayer(selectedId, { zIndex: selectedLayer.zIndex + 1 });
      saveHistory();
    }
  };

  const handleMoveDown = () => {
    const minZIndex = Math.min(...layers.map((l) => l.zIndex));
    if (selectedLayer.zIndex > minZIndex) {
      updateLayer(selectedId, { zIndex: selectedLayer.zIndex - 1 });
      saveHistory();
    }
  };

  const handleDuplicate = () => {
    const newLayer = {
      ...selectedLayer,
      id: Math.random().toString(36).substr(2, 9),
      x: selectedLayer.x + 20,
      y: selectedLayer.y + 20,
      zIndex: Math.max(...layers.map((l) => l.zIndex)) + 1,
    };
    addLayer(newLayer);
    saveHistory();
  };

  const handleDelete = () => {
    useStore.setState((state) => ({
      layers: state.layers.filter((l) => l.id !== selectedId),
      selectedId: null,
    }));
    saveHistory();
  };

  // Position the toolbar based on the selected layer
  // For now, we'll use a fixed position that can be improved later
  const toolbarStyle = {
    position: 'absolute' as const,
    top: Math.max(selectedLayer.y - 50, 10),
    left: selectedLayer.x + (selectedLayer.width || 100) / 2 - 100,
    transform: 'translateX(0)',
    zIndex: 1000,
  };

  return (
    <div
      style={toolbarStyle}
      className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1.5"
    >
      <button
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={handleMoveUp}
        title="上移图层"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={handleMoveDown}
        title="下移图层"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
        onClick={handleDuplicate}
        title="复制"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        className="p-1.5 rounded-lg hover:bg-gray-100 text-orange-500"
        title="分层编辑"
      >
        <span className="text-xs font-medium flex flex-col leading-tight">
          <span>分层</span>
          <span>编辑</span>
        </span>
      </button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
        onClick={handleDelete}
        title="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
