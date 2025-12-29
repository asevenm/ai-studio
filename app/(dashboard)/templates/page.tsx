'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '@/components/templates/TemplateCard';
import TemplateFilters from '@/components/templates/TemplateFilters';

interface Template {
  id: string;
  name: string;
  platform: string;
  category: string;
  thumbnail: string;
}

const PLATFORMS = ['Temu', 'Amazon', 'TikTok', 'AliExpress'];
const CATEGORIES = ['3C数码', '服饰', '美妆', '家居'];

// Mock templates for demonstration
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: '极简3C数码',
    platform: 'Temu',
    category: '3C数码',
    thumbnail: '/templates/3c-minimal.jpg',
  },
  {
    id: '2',
    name: '欧美街拍风',
    platform: 'Amazon',
    category: '服饰',
    thumbnail: '/templates/fashion-street.jpg',
  },
  {
    id: '3',
    name: '马卡龙美妆',
    platform: 'TikTok',
    category: '美妆',
    thumbnail: '/templates/beauty-macaron.jpg',
  },
  {
    id: '4',
    name: '现代轻奢家居',
    platform: 'Temu',
    category: '家居',
    thumbnail: '/templates/home-luxury.jpg',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedPlatform, selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedPlatform) params.set('platform', selectedPlatform);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`/api/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      } else {
        // Use mock data if API not available
        let filtered = MOCK_TEMPLATES;
        if (selectedPlatform) {
          filtered = filtered.filter((t) => t.platform === selectedPlatform);
        }
        if (selectedCategory) {
          filtered = filtered.filter((t) => t.category === selectedCategory);
        }
        setTemplates(filtered);
      }
    } catch (error) {
      // Use mock data on error
      let filtered = MOCK_TEMPLATES;
      if (selectedPlatform) {
        filtered = filtered.filter((t) => t.platform === selectedPlatform);
      }
      if (selectedCategory) {
        filtered = filtered.filter((t) => t.category === selectedCategory);
      }
      setTemplates(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates/${templateId}/apply`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/editor/${data.designId}`);
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">风格模板库</h1>
        <p className="text-gray-500">
          精选各大平台爆款视觉风格，点击即可套用至您的商品
        </p>
      </div>

      {/* Filters */}
      <TemplateFilters
        platforms={PLATFORMS}
        categories={CATEGORIES}
        selectedPlatform={selectedPlatform}
        selectedCategory={selectedCategory}
        onPlatformChange={setSelectedPlatform}
        onCategoryChange={setSelectedCategory}
      />

      {/* Template Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          暂无符合条件的模板
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              platform={template.platform}
              category={template.category}
              thumbnail={template.thumbnail}
              onApply={() => handleApplyTemplate(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
