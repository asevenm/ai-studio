'use client';

import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AICommandBarProps {
  onSendCommand?: (command: string) => Promise<void>;
  onGenerate?: () => Promise<void>;
}

export default function AICommandBar({ onSendCommand, onGenerate }: AICommandBarProps) {
  const [command, setCommand] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = async () => {
    if (!command.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendCommand?.(command);
      setCommand('');
    } catch (error) {
      console.error('Send command error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerate?.();
    } catch (error) {
      console.error('Generate error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-16 bg-white border-t border-gray-200 flex items-center px-4 gap-3">
      {/* Input */}
      <div className="flex-1 relative">
        <Input
          placeholder="输入AI修改指令..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pr-10 h-11 rounded-xl"
        />
        <button
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
            command.trim()
              ? 'text-orange-500 hover:bg-orange-50'
              : 'text-gray-300'
          }`}
          onClick={handleSend}
          disabled={!command.trim() || isSending}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Generate Button */}
      <Button
        className="bg-gray-900 hover:bg-gray-800 text-white gap-2 h-11 px-6 rounded-xl"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            生成
          </>
        )}
      </Button>
    </div>
  );
}
