import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  Square, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Code2, 
  X, 
  Sparkles, 
  Film, 
  ArrowRight,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { Attachment } from '../types/chat';
import { soundFx } from '../utils/audio';
import { useSpeechListener } from '../utils/useSpeechListener';

interface ChatInputDockProps {
  onSendMessage: (text: string, attachment?: Attachment) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  onOpenImageStudio?: (image?: string) => void;
  onOpenVeoStudio?: (image?: string) => void;
  onOpenGenerativeStudio?: () => void;
}

export const ChatInputDock: React.FC<ChatInputDockProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  onOpenImageStudio,
  onOpenVeoStudio,
  onOpenGenerativeStudio,
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Robust speech listener
  const {
    isListening,
    interimText,
    audioVolume,
    voiceNotice,
    setVoiceNotice,
    startListening,
    stopListening,
  } = useSpeechListener();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAttachMenu]);

  const handleSend = () => {
    if ((!input.trim() && !attachment) || isGenerating) return;
    if (isListening) stopListening();
    soundFx.playChime();
    onSendMessage(input.trim(), attachment || undefined);
    setInput('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64,
      });
      soundFx.playClick();
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(input, (newText) => {
        setInput(newText);
      });
    }
  };

  return (
    <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-[#050508] via-[#050508]/90 to-transparent p-3 sm:p-4">
      <div className="mx-auto w-full max-w-3xl">
        {/* Voice Notice Toast */}
        {voiceNotice && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/90 backdrop-blur-xl px-3 py-2 text-xs text-rose-200 shadow-xl animate-fadeIn">
            <span>{voiceNotice}</span>
            <button onClick={() => setVoiceNotice(null)} className="p-0.5 hover:text-white">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Attachment preview if user uploaded a file */}
        {attachment && (
          <div className="mb-2 inline-flex items-center gap-2.5 rounded-2xl border border-amber-500/40 bg-[#12121c]/95 backdrop-blur-xl p-2 pr-3.5 shadow-xl animate-fadeIn">
            <img
              src={attachment.data}
              alt="attachment"
              className="h-9 w-9 rounded-xl object-cover border border-amber-500/30"
            />
            <span className="text-xs text-white max-w-[200px] truncate font-medium">{attachment.name}</span>
            <button
              onClick={() => setAttachment(null)}
              className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 2027 Command Dock */}
        <div className="glass-dock-2027 rounded-2xl p-1.5 flex items-center gap-2 transition-all duration-300 focus-within:border-amber-400/60 focus-within:shadow-[0_0_25px_rgba(245,158,11,0.22)]">
          {/* Chat Dropdown Menu Button (+) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowAttachMenu(!showAttachMenu);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all shrink-0 active:scale-95 ${
                showAttachMenu
                  ? 'border-amber-400/80 bg-amber-500/20 text-amber-300'
                  : 'bg-white/[0.05] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.1] hover:border-amber-500/40'
              }`}
              title="Chat dropdown menu (+)"
            >
              <Plus size={17} className={`transition-transform duration-200 ${showAttachMenu ? 'rotate-45 text-amber-400' : ''}`} />
            </button>

            {/* Chat Dropdown Menu Panel */}
            {showAttachMenu && (
              <div className="absolute left-0 bottom-12 w-80 sm:w-96 rounded-2xl border border-white/[0.12] bg-[#0e0e17]/98 backdrop-blur-2xl p-2.5 text-left shadow-2xl z-50 animate-fadeIn text-xs">
                {/* 4 Starters */}
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Chat Starters</span>
                  <span className="text-[9px] font-mono text-gray-400">4 Starters</span>
                </div>

                <div className="space-y-1 mb-2">
                  {[
                    {
                      title: 'Synthesize 3D Particle Galaxy',
                      desc: 'Interactive 60FPS canvas simulation with live sandbox preview',
                      icon: '🌌',
                      category: 'Supru Code',
                      prompt: 'Build an interactive 3D particle constellation simulation with mouse gravity, color morphing, and shockwaves in HTML & Canvas.',
                    },
                    {
                      title: 'Autonomous AST Architecture Audit',
                      desc: 'Audit dependencies, find edge cases, and synthesize unit tests',
                      icon: '🎯',
                      category: 'Supru Hunter',
                      prompt: 'Audit current codebase invariants, detect race conditions, and synthesize comprehensive automated unit tests.',
                    },
                    {
                      title: 'Animate Photos into Cinematic Video',
                      desc: 'High-fidelity fluid motion synthesis using Veo 3.1 Fast',
                      icon: '🎬',
                      category: 'Veo Motion',
                      prompt: 'Animate this cyberpunk scene into a 720p cinematic tracking shot with neon reflections and volumetric rain.',
                    },
                    {
                      title: 'Shor’s Quantum Computing Breakdown',
                      desc: 'Period-finding, modular math & superposition with feline genius',
                      icon: '🐾',
                      category: 'Quantum AI',
                      prompt: 'Explain Shor’s algorithm and quantum superposition like an unimpressed senior feline engineer with code snippets.',
                    },
                  ].map((starter) => (
                    <button
                      key={starter.title}
                      onClick={() => {
                        soundFx.playClick();
                        setShowAttachMenu(false);
                        onSendMessage(starter.prompt);
                      }}
                      className="group flex w-full items-start gap-2.5 rounded-xl p-2 text-left hover:bg-white/[0.08] border border-transparent hover:border-amber-500/30 transition-all"
                    >
                      <span className="text-base shrink-0 mt-0.5">{starter.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white group-hover:text-amber-300 text-xs truncate">
                            {starter.title}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 group-hover:text-amber-400 ml-1 shrink-0">
                            {starter.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                          {starter.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-white/[0.08] my-1.5" />

                {/* Media & Tools */}
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Media & Tools
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 font-medium text-gray-200 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <ImageIcon size={14} className="text-amber-400" />
                    <span>Upload Image for Chat</span>
                  </button>

                  {onOpenGenerativeStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenGenerativeStudio();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 font-medium text-pink-300 hover:bg-pink-500/10 transition-colors"
                    >
                      <Sparkles size={14} className="text-pink-400" />
                      <span>Supru Generative Studio</span>
                    </button>
                  )}

                  {onOpenImageStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenImageStudio(attachment?.data);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
                    >
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Supru Vision Studio</span>
                    </button>
                  )}

                  {onOpenVeoStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenVeoStudio(attachment?.data);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 font-medium text-orange-300 hover:bg-orange-500/10 transition-colors"
                    >
                      <Film size={14} className="text-orange-400" />
                      <span>Supru Motion (Veo 3.1)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setInput((prev) => (prev ? `${prev} [Review code]` : 'Review and optimize this code: '));
                      setShowAttachMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 font-medium text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <Code2 size={14} className="text-sky-400" />
                    <span>Code Optimization</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Supru is ready to hear from you......."
            className="flex-1 bg-transparent px-3 text-xs sm:text-[13.5px] text-white placeholder-gray-500 outline-none disabled:opacity-50 font-sans"
            autoFocus
          />

          {/* Clear input / voice button */}
          {(input || interimText) && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setInput('');
                if (isListening) {
                  stopListening();
                }
              }}
              className="flex h-9 items-center justify-center rounded-xl px-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs shrink-0"
              title="Clear voice / text input"
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
            }`}
            title={isListening ? 'Listening...' : 'Voice input'}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Send or Stop button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 transition-all shrink-0"
              title="Stop Generation"
            >
              <Square size={13} className="fill-rose-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() && !attachment}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 shrink-0 ${
                input.trim() || attachment
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-white/[0.05] text-gray-600 cursor-not-allowed opacity-40'
              }`}
              title="Send message"
            >
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
