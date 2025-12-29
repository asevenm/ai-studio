'use client';

interface TemplateFiltersProps {
  platforms: string[];
  categories: string[];
  selectedPlatform: string | null;
  selectedCategory: string | null;
  onPlatformChange: (platform: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

export default function TemplateFilters({
  platforms,
  categories,
  selectedPlatform,
  selectedCategory,
  onPlatformChange,
  onCategoryChange,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 mb-8">
      {/* Platform Filter */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedPlatform === null
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => onPlatformChange(null)}
        >
          全部平台
        </button>
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedPlatform === platform
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => onPlatformChange(platform)}
          >
            {platform}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => onCategoryChange(null)}
        >
          全部类目
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
