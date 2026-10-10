import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  Film, 
  Wand2
} from 'lucide-react';
import { Message } from '../types/chat';
import { MarkdownRenderer } from './MarkdownRenderer';
import { soundFx } from '../utils/audio';

interface ChatMessageItemProps {
  message: Message;
  isLatest: boolean;
  onRegenerate?: () => void;
  isStreaming?: boolean;
  onAnimateWithVeo?: (imageUrl: string) => void;
  onEditWithImageStudio?: (imageUrl: string) => void;
  onOpenInEditor?: (code: string, language: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isLatest,
  onRegenerate,
  isStreaming,
  onAnimateWithVeo,
  onEditWithImageStudio,
  onOpenInEditor,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      message.content.replace(/```[\s\S]*?```/g, 'Code block omitted.')
    );
    utterance.rate = 1.05;
    utterance.pitch = 1.08;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isUser) {
    return (
      <div className="flex w-full justify-end px-3 py-3 group animate-fadeIn">
        <div className="flex max-w-[90%] sm:max-w-[78%] flex-col items-end space-y-1.5">
          {/* Unboxed clean metadata without pills */}
          <div className="flex items-center gap-2 text-[10.5px] text-gray-500 font-mono">
            <span>You</span>
            <span aria-hidden="true">·</span>
            <span>{formatTime(message.timestamp)}</span>
          </div>

          {/* Attachment Preview if present */}
          {message.attachment && (
            <div className="overflow-hidden rounded-2xl border border-amber-500/30 bg-[#161622]/90 backdrop-blur-xl p-2 mb-1 shadow-lg">
              <img
                src={message.attachment.data}
                alt="attachment preview"
                className="max-h-60 max-w-xs rounded-xl object-contain border border-white/[0.08]"
              />
              <div className="flex items-center gap-2 pt-2 px-1 justify-end">
                {onAnimateWithVeo && (
                  <button
                    onClick={() => onAnimateWithVeo(message.attachment!.data)}
                    className="flex items-center gap-1 rounded-xl bg-orange-500/20 border border-orange-500/30 px-2.5 py-1 text-[10.5px] font-semibold text-orange-300 hover:bg-orange-500/30 transition-colors"
                  >
                    <Film size={11} />
                    <span>Animate with Veo</span>
                  </button>
                )}
                {onEditWithImageStudio && (
                  <button
                    onClick={() => onEditWithImageStudio(message.attachment!.data)}
                    className="flex items-center gap-1 rounded-xl bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 text-[10.5px] font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
                  >
                    <Wand2 size={11} />
                    <span>Edit in Studio</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Message Bubble */}
          <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#1e1e2d] to-[#161622] border border-white/[0.12] px-4 py-3 text-sm sm:text-[15px] text-white shadow-xl leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start px-3 py-4 group animate-fadeIn">
      <div className="flex max-w-[96%] sm:max-w-[88%] items-start gap-3.5">
        {/* Real Supru Cat Avatar with 2027 Illuminated Halo */}
        <div className="relative mt-1 shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-[#101018] shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-transform group-hover:scale-105">
            <img
              src="/cat_icon.png"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
              alt="Supru Ecosystem"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#050508] bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        {/* Message Container */}
        <div className="flex-1 space-y-2">
          {/* Header Metadata (Unboxed, clean 2027 design) */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-extrabold text-gradient-amber text-xs">Supru Ecosystem</span>
            <span aria-hidden="true" className="text-gray-600">·</span>
            <span className="text-gray-400 font-mono text-[10.5px]">
              {message.model
                ? `${message.model} · ${message.provider || 'provider not recorded'}`
                : 'Model not recorded for this message'}
            </span>
            <span aria-hidden="true" className="text-gray-600">·</span>
            <span className="text-gray-500 font-mono text-[10px]">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* 2027 Glass Message Card */}
          <div className="glass-panel-2027 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-sm sm:text-[15px] text-[#e5e7eb] shadow-xl border border-white/[0.08] relative">
            <MarkdownRenderer content={message.content} onOpenInEditor={onOpenInEditor} />

            {/* Pulsing indicator during stream */}
            {isStreaming && (
              <span className="inline-block h-4 w-2 ml-1 animate-pulse bg-amber-400 rounded-sm align-middle shadow-[0_0_10px_#f59e0b]" />
            )}
          </div>

          {/* Action Toolbar */}
          {!isStreaming && (
            <div className="flex items-center gap-1 text-gray-400 pt-1 text-xs">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSpeak}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium hover:bg-white/[0.08] transition-colors ${
                  isSpeaking ? 'text-amber-400 bg-amber-500/10' : 'hover:text-white'
                }`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud with AI voice'}
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>

              {isLatest && onRegenerate && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onRegenerate();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium hover:bg-white/[0.08] hover:text-white transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw size={13} />
                  <span>Retry</span>
                </button>
              )}

              <div className="h-3 w-[1px] bg-white/[0.08] mx-1" />

              <button
                onClick={() => {
                  soundFx.playClick();
                  setFeedback(feedback === 'up' ? null : 'up');
                }}
                className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors ${
                  feedback === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-white'
                }`}
                title="Accurate response"
              >
                <ThumbsUp size={13} />
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setFeedback(feedback === 'down' ? null : 'down');
                }}
                className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors ${
                  feedback === 'down' ? 'text-rose-400 bg-rose-500/10' : 'hover:text-white'
                }`}
                title="Needs improvement"
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
