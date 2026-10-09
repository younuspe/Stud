import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  X, 
  ArrowRight,
  Code2, 
  Film, 
  Wand2,
  Terminal,
  Bot,
  Zap,
  ShieldCheck,
  Compass,
  ChevronDown,
  Trash2,
  Apple
} from 'lucide-react';
import { Attachment, PersonaType } from '../types/chat';
import { soundFx } from '../utils/audio';
import { useSpeechListener } from '../utils/useSpeechListener';

interface HeroLandingProps {
  onSendMessage: (text: string, attachment?: Attachment) => void;
  activePersona: PersonaType;
  onOpenImageStudio?: (imageUrl?: string) => void;
  onOpenVeoStudio?: (imageUrl?: string) => void;
  onOpenAIStudio?: () => void;
  onOpenGenerativeStudio?: () => void;
  onOpenMacOSInstall?: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onSendMessage,
  activePersona,
  onOpenImageStudio,
  onOpenVeoStudio,
  onOpenAIStudio,
  onOpenGenerativeStudio,
  onOpenMacOSInstall,
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Robust continuous speech listener
  const {
    isListening,
    interimText: interimVoiceText,
    audioVolume,
    voiceNotice,
    setVoiceNotice,
    startListening,
    stopListening,
    applyQuickPrompt,
    quickPrompts,
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !attachment) return;

    if (isListening) {
      stopListening();
    }

    soundFx.playChime();
    onSendMessage(input.trim(), attachment || undefined);
    setInput('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setVoiceNotice('Please upload a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: reader.result as string,
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

  const PROMPT_STARTERS_2027 = [
    {
      title: 'Supru Generative Studio',
      desc: 'Manifest 4D world-states, liquid canvas physics & multimodal art',
      icon: '✨',
      category: 'Genesis Engine',
      prompt: 'Open Supru Generative Studio',
      action: onOpenGenerativeStudio,
    },
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
      title: 'Install Native macOS App (.dmg)',
      desc: '120 FPS Direct-to-Metal GPU rendering & 8-Agent offline pipelines',
      icon: '',
      category: 'macOS Universal',
      prompt: 'Install Supru Generative Studio on macOS',
      action: onOpenMacOSInstall,
    },
  ];

  return (
    <div className="relative flex flex-1 flex-col items-center px-4 text-center select-none overflow-y-auto custom-scrollbar bg-spatial-void min-h-full">
      {/* 2027 Futuristic Spatial Glow Lighting */}
      <div className="pointer-events-none absolute -top-40 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-30 -right-20 h-[360px] w-[360px] rounded-full bg-violet-600/8 blur-[120px]" />

      {/* TOP SECTION: Upper half above the middle */}
      <div className="flex-1 flex flex-col justify-end items-center pb-4 w-full max-w-3xl space-y-3 z-10 shrink-0 pt-4">
        {/* Sleek Big Avatar */}
        <div className="relative group">
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Supru Ecosystem"
            className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-3xl object-cover border-2 border-amber-400/90 transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Title: Supru Generative Studio - Sovereign Command */}
        <div className="space-y-1.5 text-center">
          <div className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider text-white uppercase font-sans">
                SUPRU <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">GENERATIVE STUDIO</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              <span>SOVEREIGN COMMAND • SUPREME INTELLIGENCE ONLINE</span>
            </span>
          </div>

          {/* Buttons for Supru Generative Studio & macOS App */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            {onOpenGenerativeStudio && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playChime();
                  onOpenGenerativeStudio();
                }}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-pink-500/50 bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-amber-500/20 hover:from-pink-500/30 hover:to-amber-500/30 text-pink-300 font-bold text-xs shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all hover:scale-105 active:scale-95"
                title="Launch Full Supru Generative Studio Workspace"
              >
                <Sparkles size={14} className="text-pink-400 group-hover:rotate-12 transition-transform" />
                <span>Launch Supru Generative Studio</span>
                <ArrowRight size={13} className="text-pink-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {onOpenMacOSInstall && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playChime();
                  onOpenMacOSInstall();
                }}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/[0.15] bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Install Supru Generative Studio on macOS (.dmg Universal)"
              >
                <Apple size={14} className="text-white" />
                <span>Install on Mac (.dmg)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CENTER PROMPT COMMAND ISLAND: Top lies in the middle of screen */}
      <div className="w-full max-w-2xl shrink-0 z-20">
        {/* Attachment preview if user uploaded an image */}
        {attachment && (
          <div className="mb-2 inline-flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#141420]/90 backdrop-blur-xl p-2 pr-4 shadow-xl animate-fadeIn">
            <img
              src={attachment.data}
              alt="attachment"
              className="h-10 w-10 rounded-xl object-cover border border-amber-500/30"
            />
            <div className="text-left text-xs">
              <div className="font-semibold text-white truncate max-w-[180px]">{attachment.name}</div>
              <div className="text-[10px] text-amber-400 font-mono">Ready for multimodal analysis</div>
            </div>
            {onOpenVeoStudio && (
              <button
                type="button"
                onClick={() => onOpenVeoStudio(attachment.data)}
                className="ml-2 flex items-center gap-1 rounded-xl bg-orange-500/20 px-2.5 py-1 text-xs font-semibold text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
                title="Animate this photo with Veo 3.1"
              >
                <Film size={12} />
                <span>Animate</span>
              </button>
            )}
            <button
              onClick={() => setAttachment(null)}
              className="ml-1 rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Voice Warning / Notification Toast */}
        {voiceNotice && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/90 backdrop-blur-xl px-3.5 py-2 text-xs text-rose-200 shadow-xl animate-fadeIn text-left">
            <span>{voiceNotice}</span>
            <button onClick={() => setVoiceNotice(null)} className="p-0.5 hover:text-white">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Live Voice Recording Audio Wave Banner */}
        {isListening && (
          <div className="mb-2.5 rounded-2xl border border-amber-500/60 bg-[#12121e]/95 backdrop-blur-xl p-3 shadow-2xl animate-fadeIn text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                {/* Real-time Dynamic Audio Wave Bars based on audioVolume */}
                <div className="flex items-center gap-1 h-5">
                  <span
                    className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(6, Math.min(22, 6 + (audioVolume / 100) * 16))}px` }}
                  />
                  <span
                    className="w-1 bg-amber-300 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(8, Math.min(24, 8 + (audioVolume / 100) * 18))}px` }}
                  />
                  <span
                    className="w-1 bg-amber-500 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(5, Math.min(20, 5 + (audioVolume / 100) * 15))}px` }}
                  />
                  <span
                    className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(7, Math.min(22, 7 + (audioVolume / 100) * 16))}px` }}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>Listening continuously... Speak into mic</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                      Vol: {audioVolume}%
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-300 italic truncate max-w-[280px]">
                    {interimVoiceText || input || 'Listening for speech input...'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {input && (
                  <button
                    onClick={() => {
                      setInput('');
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] px-2 py-1 text-xs text-gray-300"
                    title="Clear transcript"
                  >
                    <Trash2 size={11} className="text-rose-400" />
                    <span>Clear</span>
                  </button>
                )}
                <button
                  onClick={toggleVoiceRecording}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1 text-xs shadow-md"
                >
                  <span>Done</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Voice Command Chips */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px]">
              <span className="text-[10px] text-gray-400 shrink-0 font-medium">Quick Voice Chips:</span>
              {quickPrompts.slice(0, 4).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    applyQuickPrompt(chip, (newText) => setInput(newText));
                  }}
                  className="rounded-lg bg-white/[0.05] hover:bg-amber-500/20 hover:text-amber-300 border border-white/[0.08] hover:border-amber-400/40 px-2 py-0.5 text-gray-300 whitespace-nowrap transition-colors shrink-0"
                >
                  🗣️ "{chip.length > 32 ? chip.slice(0, 32) + '...' : chip}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div 
          className="glass-dock-2027 rounded-2xl px-2 flex items-center gap-1.5 w-[500px] max-w-full h-[40px] border-2 transition-all duration-300 focus-within:border-amber-400/60 focus-within:shadow-[0_0_25px_rgba(245,158,11,0.25)] mx-auto"
          style={{ width: '500px', height: '40px', borderWidth: '2px' }}
        >
          {/* Chat Dropdown Menu Button (+) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowAttachMenu(!showAttachMenu);
              }}
              style={{ width: '33px', height: '33px' }}
              className={`flex w-[33px] h-[33px] items-center justify-center rounded-lg border transition-all active:scale-95 shrink-0 ${
                showAttachMenu
                  ? 'border-amber-400/80 bg-amber-500/20 text-amber-300'
                  : 'bg-white/[0.05] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.1] hover:border-amber-500/40'
              }`}
              title="Chat dropdown menu (+)"
            >
              <Plus size={16} className={`transition-transform duration-200 ${showAttachMenu ? 'rotate-45 text-amber-400' : ''}`} />
            </button>

            {/* Chat Dropdown Menu Panel (Houses the 4 Starters + Media Tools) */}
            {showAttachMenu && (
              <div className="absolute left-0 bottom-12 w-80 sm:w-96 rounded-2xl border border-white/[0.12] bg-[#0d0d16]/98 backdrop-blur-2xl p-2.5 text-left shadow-2xl z-50 animate-fadeIn text-xs">
                {/* 4 Starters Moved Here */}
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Chat Starters</span>
                  <span className="text-[9px] font-mono text-gray-400">4 Starters</span>
                </div>

                <div className="space-y-1 mb-2">
                  {PROMPT_STARTERS_2027.map((starter) => (
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
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <ImageIcon size={14} className="text-amber-400" />
                    <span>Upload Image for Vision</span>
                  </button>

                  {onOpenImageStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenImageStudio(attachment?.data);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
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
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/10 transition-colors"
                    >
                      <Film size={14} className="text-orange-400" />
                      <span>Supru Motion (Veo 3.1)</span>
                    </button>
                  )}

                  {onOpenGenerativeStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenGenerativeStudio();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-500/15 border border-pink-500/20 transition-colors"
                    >
                      <Sparkles size={14} className="text-pink-400" />
                      <span>Open Supru Generative Studio</span>
                    </button>
                  )}

                  {onOpenAIStudio && (
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        onOpenAIStudio();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/15 border border-amber-500/20 transition-colors"
                    >
                      <Code2 size={14} className="text-amber-400" />
                      <span>Link / Open Supru Code Studio</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setInput('Review and optimize this code architecture: ');
                      setShowAttachMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    <Code2 size={14} className="text-sky-400" />
                    <span>Code Optimization Prompt</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Main Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Supru Ecosystem anything..."
            className="flex-1 bg-transparent px-2.5 py-1 text-xs sm:text-sm text-white placeholder-gray-500 outline-none font-sans min-w-0"
            autoFocus
          />

          {/* Clear Voice / Text Button (User Request: "make ti voics input clear") */}
          {input && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setInput('');
                if (isListening) {
                  stopListening();
                }
              }}
              style={{ width: '28px', height: '33px' }}
              className="flex w-[28px] h-[33px] items-center justify-center rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all shrink-0"
              title="Clear voice / text input"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Voice Input */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            style={{ width: '33px', height: '33px' }}
            className={`flex w-[33px] h-[33px] items-center justify-center rounded-lg transition-all shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                : 'text-gray-400 hover:bg-white/[0.08] hover:text-white'
            }`}
            title={isListening ? 'Listening continuously... Tap to stop' : 'Voice command (Speech recognition)'}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!input.trim() && !attachment}
            style={{ width: '65px', height: '33px' }}
            className={`flex w-[65px] h-[33px] items-center justify-center rounded-lg transition-all duration-300 shrink-0 ${
              input.trim() || attachment
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md hover:scale-105 active:scale-95'
                : 'bg-white/[0.05] text-gray-600 cursor-not-allowed opacity-40'
            }`}
            title="Dispatch message"
          >
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: SOVEREIGN ACTION CARDS */}
      <div className="w-full max-w-2xl z-10 shrink-0 pt-4 pb-8">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Sovereign Action Cards</span>
          </span>
          <span className="text-[9px] font-mono text-gray-500">1-Click Synthesis</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROMPT_STARTERS_2027.map((starter) => (
            <button
              key={starter.title}
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (starter.action) {
                  starter.action();
                } else {
                  onSendMessage(starter.prompt);
                }
              }}
              className="group relative flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12121e]/80 to-[#0a0a14]/90 p-3 text-left backdrop-blur-xl transition-all duration-300 hover:border-amber-400/50 hover:bg-[#161626] hover:shadow-[0_0_25px_rgba(245,158,11,0.18)] hover:-translate-y-0.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-lg shrink-0 group-hover:scale-110 transition-transform">
                {starter.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                    {starter.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-gray-400 group-hover:text-amber-400 group-hover:bg-amber-500/10 shrink-0">
                    {starter.category}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-1 group-hover:text-gray-300">
                  {starter.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
