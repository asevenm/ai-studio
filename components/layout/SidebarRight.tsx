'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Sparkles, ImagePlus, Loader2, Upload, Type } from 'lucide-react';

export default function SidebarRight() {
  const { addLayer, saveHistory, projectInfo, platform } = useStore();
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // ... existing handleFileChange ...

  const handleGenerateBg = async () => {
      // ... existing handleGenerateBg ...
  }

  const handleGenerateCopy = async () => {
    if (!projectInfo) {
      alert("Project information missing.");
      return;
    }

    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/ai/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectInfo, platform })
      });
      const data = await res.json();
      if (data.success) {
        // Add headline
        addLayer({
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          x: 100,
          y: 100,
          text: data.data.headline,
          fontSize: 48,
          fill: '#000000',
          zIndex: 20
        });
        // Add description
        addLayer({
          id: Math.random().toString(36).substr(2, 9),
          type: 'text',
          x: 100,
          y: 180,
          text: data.data.description,
          fontSize: 24,
          fill: '#333333',
          zIndex: 19
        });
        saveHistory();
      } else {
        alert(`Copy generation failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error generating copy');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  return (
    <div className="w-[300px] h-full bg-white border-l border-gray-200 flex flex-col z-20">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" /> AI Assistant
        </h2>
      </div>
      
      <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1 pb-10">
        
        {/* Product Extraction Section */}
        {/* ... */}

        {/* Background Generation Section */}
        {/* ... */}

        {/* Copy Generation Section */}
        <div className="flex flex-col gap-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">3. AI Copywriting</h3>
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex flex-col gap-3">
                <div className="text-xs text-purple-700">
                    Automatically generate catchy headlines and descriptions based on your SKU properties.
                </div>
                <button 
                    onClick={handleGenerateCopy}
                    disabled={isGeneratingCopy || !projectInfo}
                    className="w-full py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {isGeneratingCopy ? <Loader2 size={16} className="animate-spin" /> : <Type size={16} />}
                    Generate SKU Copy
                </button>
             </div>
        </div>

      </div>
    </div>
  );
}
