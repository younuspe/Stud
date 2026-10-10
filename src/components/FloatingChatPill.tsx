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
  Terminal,
  Bot,
  GitBranch,
  Workflow,
  Layers,
  ChevronUp,
  Cpu,
  Trash2,
  Volume2,
  ExternalLink,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Attachment } from '../types/chat';
import { WorkspaceView } from '../types/workbench';
import { soundFx } from '../utils/audio';
import { useSpeechListener } from '../utils/useSpeechListener';

interface FloatingChatPillProps {
  onSendMessage: (text: string, attachment?: Attachment) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  activeWorkspaceView: WorkspaceView;
  onChangeWorkspaceView: (view: WorkspaceView) => void;
  onOpenImageStudio?: (image?: string) => void;
  onOpenVeoStudio?: (image?: string) => void;
  onOpenAddModels?: () => void;
  onBuildRequest?: (text: string) => void;
  activeModelName?: string;
}

export const FloatingChatPill: React.FC<FloatingChatPillProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  activeWorkspaceView,
  onChangeWorkspaceView,
  onOpenImageStudio,
  onOpenVeoStudio,
  onOpenAddModels,
  onBuildRequest,
  activeModelName = 'Gemini 3.8 Flash',
}) => {
  const [input, setInput] = useState('');
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'en-US' | 'ml-IN'>('en-US');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isListening: isRecording,
    interimText: interimVoiceText,
    audioVolume,
    voiceNotice,
    setVoiceNotice,
    startListening,
    stopListening,
    applyQuickPrompt,
    quickPrompts,
  } = useSpeechListener({ language: voiceLanguage });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  // Clean voice notice timeout
  useEffect(() => {
    if (voiceNotice) {
      const timer = setTimeout(() => setVoiceNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [voiceNotice]);

  const handleSend = () => {
    if ((!input.trim() && !attachment) || isGenerating) return;
    soundFx.playChime();
    if (isBuildMode && input.trim() && !attachment && onBuildRequest) {
      onBuildRequest(input.trim());
    } else {
      if (isBuildMode && attachment) {
        setVoiceNotice('Build mode accepts text prompts only; the attachment was sent to regular chat.');
      }
      onSendMessage(input.trim(), attachment || undefined);
    }
    setInput('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear Voice / Input Button
  const handleClearInput = () => {
    soundFx.playClick();
    setInput('');
    setAttachment(null);
    if (isRecording) {
      stopListening();
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
      setShowMenu(false);
    };
    reader.readAsDataURL(file);
  };

  // Crystal-Clear Voice Recording using robust listener
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening(input, (newText) => {
        setInput(newText);
      });
    }
  };

  // Ecosystem Hub Navigation options
  const ECOSYSTEM_TABS: { id: WorkspaceView; label: string; icon: React.ReactNode; desc: string; badge?: string }[] = [
    { id: 'generative', label: 'Generative Studio', icon: <Sparkles size={16} className="text-pink-400" />, desc: '4D World-States, Liquid Canvas, Image, Video & Audio Genesis', badge: 'Genesis' },
    { id: 'editor', label: 'Supru Code', icon: <Code2 size={16} className="text-amber-400" />, desc: 'Interactive Code Studio, Monaco Editor & Live HTML Sandbox', badge: 'Core' },
    { id: 'chat', label: 'Supru Chat', icon: <Sparkles size={16} className="text-amber-300" />, desc: 'Conversational Neural AI Engine with Multimodal Vision', badge: 'Chat' },
    { id: 'terminal', label: 'Supru CLI', icon: <Terminal size={16} className="text-emerald-400" />, desc: 'Full bash terminal with direct system access & execution' },
    { id: 'agent', label: 'Supru Hunter', icon: <Bot size={16} className="text-purple-400" />, desc: 'Autonomous Sovereign AI Agent with web search & inspection' },
    { id: 'github', label: 'Supru Git', icon: <GitBranch size={16} className="text-sky-400" />, desc: 'Interactive Git commit graph & repository synchronization' },
    { id: 'orchestrator', label: 'Supru Orchestrator', icon: <Workflow size={16} className="text-orange-400" />, desc: 'Multi-Agent Swarm & Autonomous Execution Pipelines' },
    { id: 'topology', label: 'The Stratified Stack', icon: <Layers size={16} className="text-pink-400" />, desc: 'v1.3.0 Cellular Bedrock, MicroVMs & Z3 Verification' },
  ];

  // If minimized, display a sleek compact floating capsule
  if (isMinimized) {
    return (
      <aside aria-label="Floating Chat Pill Minimized" className="fixed bottom-4 right-6 z-40 animate-fadeIn">
        <button
          onClick={() => {
            soundFx.playClick();
            setIsMinimized(false);
          }}
          className="flex items-center gap-2 rounded-2xl border-2 border-amber-400/80 bg-[#0d0d16]/95 px-4 py-2.5 shadow-[0_10px_30px_rgba(245,158,11,0.3)] backdrop-blur-2xl hover:scale-105 active:scale-95 transition-all group"
          title="Expand Floating Chat Pill"
        >
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Supru"
            className="h-6 w-6 rounded-lg object-cover border border-amber-400"
          />
          <span className="text-xs font-bold text-amber-300">Supru Floating Pill</span>
          <Maximize2 size={13} className="text-gray-400 group-hover:text-white" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Floating Chat Pill Dock" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-3xl pointer-events-auto animate-fadeIn">
      {/* Voice Warning / Notification Toast */}
      {voiceNotice && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/90 backdrop-blur-xl px-3 py-2 text-xs text-rose-200 shadow-xl animate-fadeIn">
          <span>{voiceNotice}</span>
          <button onClick={() => setVoiceNotice(null)} className="p-0.5 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Live Voice Recording Audio Wave Banner */}
      {isRecording && (
        <div className="mb-2 rounded-2xl border border-amber-500/60 bg-[#12121e]/95 backdrop-blur-xl p-3 shadow-2xl animate-fadeIn text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
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
                  <span>Listening... Speak into your mic</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                    Vol: {audioVolume}%
                  </span>
                </div>
                <div className="text-[11px] text-gray-300 italic truncate max-w-[280px] sm:max-w-md">
                  {interimVoiceText || input || 'Listening for speech input...'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Clear Voice button */}
              {(input || interimVoiceText) && (
                <button
                  onClick={handleClearInput}
                  className="flex items-center gap-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] px-2.5 py-1 text-xs text-gray-300 hover:text-white transition-colors"
                  title="Clear voice transcript"
                >
                  <Trash2 size={12} className="text-rose-400" />
                  <span>Clear</span>
                </button>
              )}

              {/* Stop Voice button */}
              <button
                onClick={toggleVoiceRecording}
                className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1 text-xs shadow-md transition-all"
              >
                <Square size={11} className="fill-neutral-950" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* Quick 1-Click Voice Command Chips */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px]">
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">Quick Voice Chips:</span>
            {[
              "Shor's quantum algorithm breakdown",
              'Review and optimize current code',
              'Synthesize 3D Particle Galaxy',
              'Audit AST architecture',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  applyQuickPrompt(chip, (newText) => setInput(newText));
                }}
                className="rounded-lg bg-white/[0.05] hover:bg-amber-500/20 hover:text-amber-300 border border-white/[0.08] hover:border-amber-400/40 px-2 py-0.5 text-gray-300 whitespace-nowrap transition-colors shrink-0"
              >
                🗣️ "{chip}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 inline-flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#12121c]/95 backdrop-blur-xl p-2 pr-3.5 shadow-xl animate-fadeIn">
          <img
            src={attachment.data}
            alt="attachment"
            className="h-9 w-9 rounded-xl object-cover border border-amber-500/30"
          />
          <div className="text-left text-xs">
            <span className="text-white max-w-[200px] truncate font-medium block">{attachment.name}</span>
            <span className="text-[10px] text-amber-400 font-mono">Ready for multimodal analysis</span>
          </div>
          {onOpenVeoStudio && (
            <button
              type="button"
              onClick={() => onOpenVeoStudio(attachment.data)}
              className="flex items-center gap-1 rounded-xl bg-orange-500/20 px-2 py-1 text-[11px] font-semibold text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition-colors"
              title="Animate this photo with Veo 3.1"
            >
              <Film size={12} />
              <span>Animate</span>
            </button>
          )}
          <button
            onClick={() => setAttachment(null)}
            className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* THE FLOATING CHAT PILL CONTAINER */}
      <div className="relative rounded-2xl border-2 border-amber-500/40 bg-[#08080f]/90 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-2 flex items-center gap-2 transition-all duration-300 focus-within:border-amber-400 focus-within:shadow-[0_0_30px_rgba(245,158,11,0.35)]">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 1. ECOSYSTEM HUB & ATTACHMENT MENU TRIGGER (+) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setShowMenu(!showMenu);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              showMenu
                ? 'border-amber-400 bg-amber-500 text-neutral-950 font-black shadow-md rotate-45'
                : 'border-white/[0.1] bg-white/[0.04] text-gray-300 hover:border-amber-400/50 hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Ecosystem Menu & Actions (+)"
          >
            <Plus size={17} className="transition-transform duration-200" />
          </button>

          {/* ECOSYSTEM LAUNCHER & ACTIONS DROPDOWN */}
          {showMenu && (
            <div className="absolute bottom-12 left-0 z-50 w-80 sm:w-96 rounded-2xl border border-amber-500/40 bg-[#0f0f18]/95 p-3 shadow-2xl backdrop-blur-2xl animate-fadeIn custom-scrollbar max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Supru Ecosystem</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Switch Tab
                  </span>
                </div>
                <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white p-1">
                  <X size={14} />
                </button>
              </div>

              {/* ECOSYSTEM TABS - SWITCH ANYWHERE */}
              <div className="mt-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5">
                  Ecosystem Workspaces
                </div>
                {ECOSYSTEM_TABS.map((tab) => {
                  const isActive = activeWorkspaceView === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        onChangeWorkspaceView(tab.id);
                        setShowMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                        isActive
                          ? 'border border-amber-400/60 bg-amber-500/15 text-white font-semibold shadow-sm'
                          : 'hover:bg-white/[0.06] text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-white/[0.04]">{tab.icon}</div>
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>{tab.label}</span>
                            {tab.badge && (
                              <span className="text-[9px] px-1.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{tab.desc}</div>
                        </div>
                      </div>
                      {isActive && <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />}
                    </button>
                  );
                })}
              </div>

              {/* MEDIA & AI TOOLS */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.08] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2 py-0.5">
                  Creative Studios & AI Models
                </div>

                {/* Upload Image for Multimodal */}
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <ImageIcon size={15} className="text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Attach Image File</div>
                    <div className="text-[10px] text-gray-400">Multimodal vision reasoning & analysis</div>
                  </div>
                </button>

                {/* Vision Studio */}
                {onOpenImageStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onOpenImageStudio();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Sparkles size={15} className="text-amber-400" />
                    <div>
                      <div className="font-semibold text-white">Supru Vision Studio</div>
                      <div className="text-[10px] text-gray-400">Gemini 3.1 Flash Image synthesis & edit</div>
                    </div>
                  </button>
                )}

                {/* Veo Motion Studio */}
                {onOpenVeoStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onOpenVeoStudio();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Film size={15} className="text-orange-400" />
                    <div>
                      <div className="font-semibold text-white">Supru Motion (Veo 3.1)</div>
                      <div className="text-[10px] text-gray-400">Cinematic 720p photo-to-video generation</div>
                    </div>
                  </button>
                )}

                {/* Add Custom AI Models (With or Without API Key) */}
                {onOpenAddModels && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onOpenAddModels();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Cpu size={15} className="text-amber-400" />
                    <div>
                      <div className="font-semibold text-amber-300">Add AI Models (With/Without Key)</div>
                      <div className="text-[10px] text-gray-400">Ollama, LM Studio, Claude, DeepSeek, Groq</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat-driven app builder mode */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsBuildMode((current) => !current);
          }}
          aria-pressed={isBuildMode}
          title={isBuildMode ? 'Turn off Build by Chat mode' : 'Build or modify an app by describing changes in chat'}
          className={`flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 text-[10px] font-bold transition-colors ${isBuildMode ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-emerald-400/40 hover:text-emerald-300'}`}
        >
          <Code2 size={13} />
          <span className="hidden sm:inline">{isBuildMode ? 'Build ON' : 'Build'}</span>
        </button>

        {/* Context Badge for current workspace */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeWorkspaceView === 'editor' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/15 text-amber-300">
              <Code2 size={13} className="text-amber-400" />
              <span>Supru Code</span>
            </span>
          )}
          {activeWorkspaceView === 'generative' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-pink-500/40 bg-pink-500/15 text-pink-300">
              <Sparkles size={13} className="text-pink-400" />
              <span>Genesis</span>
            </span>
          )}
        </div>

        {/* 3. INPUT FIELD */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isBuildMode
              ? 'Describe an app or change; Supru Code will generate an editable preview...'
              : activeWorkspaceView === 'generative'
              ? 'Describe 4D scene, world-state, or visual intent for Generative Studio...'
              : activeWorkspaceView === 'editor'
              ? 'Ask Supru Code Copilot about this code, generate, or refactor (Stays in IDE)...'
              : activeWorkspaceView === 'agent'
              ? 'Enter mission objective for Supru Hunter...'
              : activeWorkspaceView === 'terminal'
              ? 'Ask for command execution or explain shell...'
              : 'Ask Supru Ecosystem anything...'
          }
          className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-white placeholder-gray-400 outline-none"
        />

        {/* 4. DEDICATED CLEAR BUTTON (User Request: "make ti voics input clear") */}
        {(input || interimVoiceText) && (
          <button
            type="button"
            onClick={handleClearInput}
            className="flex items-center gap-1 p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all text-xs"
            title="Clear text / voice input"
          >
            <Trash2 size={14} />
            <span className="hidden md:inline text-[10px]">Clear</span>
          </button>
        )}

        {/* Speech locale selector: browser recognition supports one locale per listener. */}
        <button
          type="button"
          onClick={() => {
            if (isRecording) stopListening();
            setVoiceLanguage((current) => current === 'en-US' ? 'ml-IN' : 'en-US');
          }}
          className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-semibold text-gray-300 hover:bg-white/[0.08]"
          title="Switch speech recognition language. AI responses remain in English."
          aria-label={voiceLanguage === 'en-US' ? 'Speech language English. Switch to Malayalam' : 'Speech language Malayalam. Switch to English'}
        >
          {voiceLanguage === 'en-US' ? 'EN' : 'മലയാളം'}
        </button>

        {/* 5. CRYSTAL-CLEAR VOICE INPUT BUTTON */}
        <button
          type="button"
          onClick={toggleVoiceRecording}
          className={`relative p-2 rounded-xl transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'text-gray-400 hover:text-amber-300 hover:bg-white/[0.08]'
          }`}
          title={isRecording ? 'Listening... Tap to stop' : 'Tap to speak (Clear Voice Input)'}
        >
          {isRecording ? <Mic size={16} className="text-red-400" /> : <Mic size={16} />}
        </button>

        {/* 6. SEND / STOP GENERATION BUTTON */}
        {isGenerating ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition-all"
            title="Stop generation"
          >
            <Square size={13} className="fill-white" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() && !attachment}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold text-neutral-950 shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
            title={activeWorkspaceView === 'editor' ? 'Send to Supru Code Copilot (Stays in IDE)' : 'Send to Supru'}
          >
            <Send size={13} />
            <span className="hidden sm:inline">Send</span>
          </button>
        )}

        {/* 7. MINIMIZE BUTTON */}
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsMinimized(true);
          }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
          title="Minimize floating dock"
        >
          <Minimize2 size={13} />
        </button>
      </div>
    </aside>
  );
};
