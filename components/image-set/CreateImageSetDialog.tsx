'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UploadedImage {
  file: File;
  preview: string;
}

interface CreateImageSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    configType: string;
    images: { file: File; viewType: string }[];
    extraPrompt: string;
    modelId: string;
  }) => Promise<void>;
}

const viewTypes = [
  { id: 'front', label: '正视图' },
  { id: 'side', label: '侧视图' },
  { id: 'top', label: '俯视图' },
  { id: 'accessory', label: '配件图' },
];

const aiModels = [
  { id: 'nano-banana', name: 'Nano Banana', description: '极致速度', points: 10 },
  { id: 'pro-mango', name: 'Pro Mango', description: '高质量', points: 25 },
];

export default function CreateImageSetDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateImageSetDialogProps) {
  const [configType, setConfigType] = useState('3C数码标准配置');
  const [images, setImages] = useState<Record<string, UploadedImage | null>>({
    front: null,
    side: null,
    top: null,
    accessory: null,
  });
  const [extraPrompt, setExtraPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (viewType: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) => ({
        ...prev,
        [viewType]: {
          file,
          preview: e.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (viewType: string) => {
    setImages((prev) => ({
      ...prev,
      [viewType]: null,
    }));
  };

  const handleSubmit = async () => {
    const uploadedImages = Object.entries(images)
      .filter(([_, img]) => img !== null)
      .map(([viewType, img]) => ({
        file: img!.file,
        viewType,
      }));

    if (uploadedImages.length === 0) {
      alert('请至少上传一张商品素材');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.({
        configType,
        images: uploadedImages,
        extraPrompt,
        modelId: selectedModel,
      });
      // Reset form
      setImages({ front: null, side: null, top: null, accessory: null });
      setExtraPrompt('');
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModelData = aiModels.find((m) => m.id === selectedModel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">新建套图任务</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. 配置类型选择 */}
          <div>
            <Tabs value={configType} onValueChange={setConfigType}>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger
                  value="3C数码标准配置"
                  className="py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  3C数码标准配置
                </TabsTrigger>
                <TabsTrigger
                  value="服装标准配置"
                  className="py-2.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  服装标准配置
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 2. 上传商品素材 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              2. 上传商品素材（白底图）
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {viewTypes.map((view) => (
                <div key={view.id} className="flex flex-col items-center">
                  <div
                    className="w-full aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-colors relative overflow-hidden"
                    onClick={() => fileInputRefs.current[view.id]?.click()}
                  >
                    {images[view.id] ? (
                      <>
                        <img
                          src={images[view.id]!.preview}
                          alt={view.label}
                          className="w-full h-full object-cover"
                        />
                        <button
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(view.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">上传图项</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{view.label}</span>
                  <input
                    ref={(el) => { fileInputRefs.current[view.id] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(view.id, file);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. 额外生成要求 & 4. 生成模型选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                3. 额外生成要求
              </h3>
              <Input
                placeholder="例如：背景需要赛博朋克霓虹灯风格，光影从左侧射入..."
                value={extraPrompt}
                onChange={(e) => setExtraPrompt(e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                4. 生成模型选择
              </h3>
              <div className="space-y-2">
                {aiModels.map((model) => (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedModel === model.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {model.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {model.description}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-orange-500">
                      {model.points} Pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                提交中...
              </>
            ) : (
              '立即提交生成任务'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
