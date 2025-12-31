'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ImageSetCardProps {
  id: string;
  name: string;
  configType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  images: { id: string; url: string; thumbnail?: string }[];
  onDownload?: () => void;
}

export default function ImageSetCard({
  id,
  name,
  configType,
  status,
  createdAt,
  images,
  onDownload,
}: ImageSetCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayImages = images.slice(0, 6);

  const getStatusBadge = () => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            生成中
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            已完成
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700 gap-1">
            <AlertCircle className="w-3 h-3" />
            生成失败
          </Badge>
        );
      default:
        return null;
    }
  };

  const isProcessing = status === 'processing';

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {configType} · {formatDate(createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/editor/${id}`}>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={isProcessing}>
              <Pencil className="w-4 h-4" />
              进入画布
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-orange-500 border-orange-200 hover:bg-orange-50"
            onClick={onDownload}
            disabled={isProcessing}
          >
            <Download className="w-4 h-4" />
            下载全套
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {isProcessing ? (
          // Show loading placeholders when processing
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-24 h-24 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
              >
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ))}
          </>
        ) : displayImages.length > 0 ? (
          displayImages.map((image, index) => (
            <div
              key={image.id}
              className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 relative"
            >
              <Image
                src={image.thumbnail || image.url}
                alt={`生成图片 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-gray-100 text-gray-400 text-xs">
            暂无图片
          </div>
        )}
      </div>
    </Card>
  );
}
