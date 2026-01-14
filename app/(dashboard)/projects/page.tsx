'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageSetCard from '@/components/image-set/ImageSetCard';
import CreateImageSetDialog from '@/components/image-set/CreateImageSetDialog';
import { useSession } from 'next-auth/react';
import { useImageSetStream } from '@/lib/useImageSetStream';


interface ImageSet {
  id: string;
  name: string;
  configType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  images: { id: string; url: string; thumbnail?: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function HistoryPage() {
  const [imageSets, setImageSets] = useState<ImageSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const { data: session, update: updateSession } = useSession();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if there are any processing items
  const hasProcessing = imageSets.some(set => set.status === 'processing');

  const fetchImageSets = useCallback(async (page: number = 1, searchKeyword: string = '', append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (searchKeyword) {
        params.set('keyword', searchKeyword);
      }

      const res = await fetch(`/api/image-sets?${params}`);
      if (res.ok) {
        const result = await res.json();
        if (append) {
          setImageSets(prev => [...prev, ...result.data]);
        } else {
          setImageSets(result.data);
        }
        setPagination(result.pagination);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to fetch image sets:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    return [];
  }, []);

  // Use SSE for real-time updates when there are processing items
  useImageSetStream({
    enabled: hasProcessing,
    onUpdate: (updatedSets) => {
      // Merge updated items into current list
      setImageSets(prev => {
        const updated = [...prev];
        for (const newSet of updatedSets) {
          const index = updated.findIndex(s => s.id === newSet.id);
          if (index >= 0) {
            updated[index] = newSet;
          }
        }
        return updated;
      });
    },
    onAllCompleted: () => {
      console.log('All image sets completed!');
    },
  });

  // Initial fetch
  useEffect(() => {
    fetchImageSets(1, keyword);
  }, [fetchImageSets, keyword]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setKeyword(value);
    }, 300);
  };

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && pagination?.hasMore && !loadingMore && !loading) {
          fetchImageSets(pagination.page + 1, keyword, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [pagination, loadingMore, loading, fetchImageSets, keyword]);

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

      // 4. 刷新列表（重置到第一页）
      await fetchImageSets(1, keyword);
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Create image set error:', error);
      alert(error.message || '操作失败，请重试');
    }
  };


  const handleDownload = async (imageSetId: string) => {
    // TODO: Implement download functionality
    window.open(`/api/image-sets/${imageSetId}/download`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">生成历史</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索套图名称..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            新建套图
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : imageSets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p className="mb-4">{keyword ? '没有找到匹配的套图' : '暂无生成历史'}</p>
          {!keyword && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              创建第一个套图
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {imageSets.map((imageSet) => (
            <ImageSetCard
              key={imageSet.id}
              id={imageSet.id}
              name={imageSet.name}
              configType={imageSet.configType}
              status={imageSet.status}
              createdAt={imageSet.createdAt}
              images={imageSet.images}
              onDownload={() => handleDownload(imageSet.id)}
            />
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>加载更多...</span>
              </div>
            )}
            {pagination && !pagination.hasMore && imageSets.length > 0 && (
              <div className="text-gray-400 text-sm">已加载全部</div>
            )}
          </div>
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
