'use client';

import { useStore } from '@/store/useStore';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';

export default function Header() {
  const { canvasTransform, setCanvasTransform, undo, redo } = useStore();

  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.1, Math.min(canvasTransform.scale + delta, 5));
    // Zooming from center of screen roughly? 
    // For simple button zoom, just scaling is fine, center might shift but acceptable for now.
    // Better implementation: Zoom towards center of viewport.
    
    // Simplest: just set scale. 
    setCanvasTransform({
        ...canvasTransform,
        scale: newScale
    });
  };

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">
                L
            </div>
            <span className="text-sm font-medium text-gray-700">Untitled Project</span>
        </div>
        
        <div className="h-4 w-px bg-gray-300 mx-2" />
        
        <div className="flex items-center gap-1">
             <button onClick={undo} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                <Undo2 size={16} />
             </button>
             <button onClick={redo} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                <Redo2 size={16} />
             </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button 
                onClick={() => handleZoom(-0.1)} 
                className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600"
            >
                <Minus size={12} />
            </button>
            <span className="text-xs w-12 text-center font-medium text-gray-600">
                {Math.round(canvasTransform.scale * 100)}%
            </span>
            <button 
                onClick={() => handleZoom(0.1)} 
                className="w-6 h-6 flex items-center justify-center hover:bg-white rounded text-gray-600"
            >
                <Plus size={12} />
            </button>
         </div>
      </div>
    </header>
  );
}
