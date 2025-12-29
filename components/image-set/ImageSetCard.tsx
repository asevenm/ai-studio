'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Pencil, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageSetCardProps {
  id: string;
  name: string;
  configType: string;
  createdAt: string;
  images: { id: string; url: string; thumbnail?: string }[];
  onDownload?: () => void;
}

export default function ImageSetCard({
  id,
  name,
  configType,
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

  return (
    <Card className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {configType} · {formatDate(createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/editor/${id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="w-4 h-4" />
              进入画布
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-orange-500 border-orange-200 hover:bg-orange-50"
            onClick={onDownload}
          >
            <Download className="w-4 h-4" />
            下载全套
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {displayImages.map((image, index) => (
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
        ))}
        {images.length === 0 && (
          <div className="flex items-center justify-center w-24 h-24 rounded-xl bg-gray-100 text-gray-400 text-xs">
            暂无图片
          </div>
        )}
      </div>
    </Card>
  );
}
