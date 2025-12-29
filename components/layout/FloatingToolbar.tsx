'use client';

import { useStore } from '@/store/useStore';
import { MousePointer2, Hand, Type, Square, Plus } from 'lucide-react';

export default function FloatingToolbar() {
  const { activeTool, setActiveTool, addLayer, saveHistory } = useStore();

  const tools = [
    { id: 'select', icon: <MousePointer2 size={20} />, label: 'Select' },
    { id: 'hand', icon: <Hand size={20} />, label: 'Hand Tool' },
    // { id: 'shape', icon: <Square size={20} />, label: 'Shape' },
    // { id: 'text', icon: <Type size={20} />, label: 'Text' },
  ];

  // Temporary direct actions for adding layers (until we have drag-to-create)
  const handleAddText = () => {
      addLayer({
        id: Math.random().toString(36).substr(2, 9),
        type: 'text',
        x: window.innerWidth / 2, // Center of screen roughly
        y: window.innerHeight / 2,
        text: 'New Text',
        fontSize: 24,
        fill: 'black',
        zIndex: 100
      });
      saveHistory();
      setActiveTool('select');
  }

  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-white shadow-xl rounded-lg border border-gray-200 p-2 flex flex-col gap-2 z-30">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id as any)}
          className={`p-2 rounded transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      
      <div className="h-px bg-gray-200 my-1" />
      
      <button 
        onClick={handleAddText}
        className="p-2 rounded hover:bg-gray-100 text-gray-700" 
        title="Add Text"
      >
        <Type size={20} />
      </button>
       <button 
        className="p-2 rounded hover:bg-gray-100 text-gray-700" 
        title="Add Rectangle (Todo)"
      >
        <Square size={20} />
      </button>
    </div>
  );
}
