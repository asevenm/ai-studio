'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TemplateCardProps {
  id: string;
  name: string;
  platform: string;
  category: string;
  thumbnail: string;
  onApply?: () => void;
}

export default function TemplateCard({
  id,
  name,
  platform,
  category,
  thumbnail,
  onApply,
}: TemplateCardProps) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all">
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden">
        <Image
          src={thumbnail}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Platform Badge */}
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700"
        >
          {platform}
        </Badge>
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={onApply}
          >
            立即套用
          </Button>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{name}</h3>
        <p className="text-sm text-gray-500">{category}</p>
      </div>
    </div>
  );
}
