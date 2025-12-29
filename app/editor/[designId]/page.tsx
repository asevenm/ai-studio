'use client';

import dynamic from 'next/dynamic';
import EditorHeader from '@/components/editor/EditorHeader';
import Toolbar from '@/components/editor/Toolbar';
import LayerPanel from '@/components/editor/LayerPanel';
import AICommandBar from '@/components/editor/AICommandBar';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { debounce } from 'lodash';

const Stage = dynamic(() => import('@/components/editor/Stage'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400">
      Loading Canvas...
    </div>
  ),
});

const FloatingActions = dynamic(
  () => import('@/components/editor/FloatingActions'),
  { ssr: false }
);

export default function EditorPage() {
  const params = useParams();
  const designId = params.designId as string;
  const { layers, setLayers, setPlatform, setProjectInfo, addLayer, saveHistory } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchDesign() {
      try {
        const res = await fetch(`/api/designs/${designId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sceneJson && Array.isArray(data.sceneJson.layers)) {
            setLayers(data.sceneJson.layers);
          }
          if (data.folder?.platform) {
            setPlatform(data.folder.platform);
          }
          if (data.folder?.project) {
            setProjectInfo(data.folder.project);
          }
        }
      } catch (err) {
        console.error('Failed to fetch design:', err);
      } finally {
        setLoading(false);
      }
    }
    if (designId) fetchDesign();
  }, [designId, setLayers, setPlatform, setProjectInfo]);

  // Auto-save logic
  const debouncedSave = useCallback(
    debounce(async (currentLayers) => {
      setSaving(true);
      try {
        await fetch(`/api/designs/${designId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneJson: { layers: currentLayers },
          }),
        });
      } catch (err) {
        console.error('Failed to auto-save:', err);
      } finally {
        setSaving(false);
      }
    }, 2000),
    [designId]
  );

  useEffect(() => {
    if (!loading && layers.length > 0) {
      debouncedSave(layers);
    }
  }, [layers, loading, debouncedSave]);

  // AI Command handlers
  const handleSendCommand = async (command: string) => {
    // TODO: Implement AI command processing
    console.log('AI Command:', command);
  };

  const handleGenerate = async () => {
    // TODO: Implement AI generation
    console.log('Generate triggered');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-gray-600">Loading Design...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 text-gray-900">
      <EditorHeader />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <Toolbar />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          <Stage />
          <FloatingActions />
          {saving && (
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-sm text-xs text-gray-500 animate-pulse border">
              保存中...
            </div>
          )}
        </div>

        {/* Right Layer Panel */}
        <LayerPanel />
      </div>

      {/* Bottom AI Command Bar */}
      <AICommandBar onSendCommand={handleSendCommand} onGenerate={handleGenerate} />
    </main>
  );
}
