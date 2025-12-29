'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageSetCard from '@/components/image-set/ImageSetCard';
import CreateImageSetDialog from '@/components/image-set/CreateImageSetDialog';
import { useSession } from 'next-auth/react';


interface ImageSet {
  id: string;
  name: string;
  configType: string;
  createdAt: string;
  images: { id: string; url: string; thumbnail?: string }[];
}

export default function HistoryPage() {
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: session, update: updateSession } = useSession();


  useEffect(() => {
    fetchImageSets();
  }, []);

  const fetchImageSets = async () => {
    try {
      const res = await fetch('/api/image-sets');
      if (res.ok) {
        const data = await res.json();
        setImageSets(data);
      }
    } catch (error) {
      console.error('Failed to fetch image sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateImageSet = async (data: {
    configType: string;
    images: { file: File; viewType: string }[];
    extraPrompt: string;
    modelId: string;
  }) => {
    // 0. 检查点数
    const userCredits = (session?.user as any)?.credits ?? 0;
    const pointsCost = 10; // 这里暂时硬编码，后续应从 API 获取或与后端同步

    if (userCredits < pointsCost) {
      alert(`点数不足！需要 ${pointsCost} Pts，当前仅有 ${userCredits} Pts。`);
      return;
    }

    try {
      // 1. 上传图片
      const formData = new FormData();
      data.images.forEach((img, index) => {
        formData.append(`images`, img.file);
        formData.append(`viewTypes`, img.viewType);
      });

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('图片上传失败，请重试');
      }

      const uploadData = await uploadRes.json();

      // 2. 创建套图任务
      const res = await fetch('/api/image-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configType: data.configType,
          extraPrompt: data.extraPrompt,
          modelId: data.modelId,
          sourceImages: uploadData.files,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '创建套图失败');
      }

      // 3. 刷新点数（通过更新 session）
      const updatedCredits = userCredits - pointsCost;
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          credits: updatedCredits
        }
      });

      // 4. 刷新列表
      await fetchImageSets();
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Create image set error:', error);
      alert(error.message || '操作失败，请重is试');
    }
  };


  const handleDownload = async (imageSetId: string) => {
    // TODO: Implement download functionality
    window.open(`/api/image-sets/${imageSetId}/download`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">生成历史</h1>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          新建套图
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : imageSets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="mb-4">暂无生成历史</p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            创建第一个套图
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {imageSets.map((imageSet) => (
            <ImageSetCard
              key={imageSet.id}
              id={imageSet.id}
              name={imageSet.name}
              configType={imageSet.configType}
              createdAt={imageSet.createdAt}
              images={imageSet.images}
              onDownload={() => handleDownload(imageSet.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateImageSetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateImageSet}
      />
    </div>
  );
}
