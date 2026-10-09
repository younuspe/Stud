import React, { useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatMessageListProps {
  messages: Message[];
  isGenerating: boolean;
  onRegenerate: () => void;
  onAnimateWithVeo?: (imageUrl: string) => void;
  onEditWithImageStudio?: (imageUrl: string) => void;
  onOpenInEditor?: (code: string, language: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isGenerating,
  onRegenerate,
  onAnimateWithVeo,
  onEditWithImageStudio,
  onOpenInEditor,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-6 md:px-12 max-w-4xl mx-auto w-full">
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1;
        const isStreaming = isGenerating && isLatest && message.role === 'assistant';

        return (
          <ChatMessageItem
            key={message.id || index}
            message={message}
            isLatest={isLatest}
            onRegenerate={onRegenerate}
            isStreaming={isStreaming}
            onAnimateWithVeo={onAnimateWithVeo}
            onEditWithImageStudio={onEditWithImageStudio}
            onOpenInEditor={onOpenInEditor}
          />
        );
      })}

      {isGenerating && messages[messages.length - 1]?.role === 'user' && (
        <div className="flex w-full justify-start px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative mt-1 shrink-0">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-amber-500/50 bg-[#121218] p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <img
                  src="/cat_icon.png"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
                  alt="Supru Ecosystem"
                  className="h-full w-full rounded-full object-cover animate-pulse"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-[#1e1e28] bg-[#121218]/90 px-4 py-3 text-xs text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Supru is thinking with sharp claws and synaptic wit...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
