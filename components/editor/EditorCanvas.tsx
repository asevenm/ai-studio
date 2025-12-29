'use client';

import dynamic from 'next/dynamic';

const StageComponent = dynamic(() => import('./Stage'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Editor...</div>,
});

export default function EditorCanvas() {
  return (
    <div className="w-full h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="shadow-2xl border border-gray-200 bg-white">
        <StageComponent />
      </div>
    </div>
  );
}
