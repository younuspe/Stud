import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Code2,
  Terminal,
  Bot,
  GitBranch,
  Settings,
  Share2,
  Volume2,
  VolumeX,
  FileCode,
  Download,
  Trash2,
  Maximize2,
  Check,
  ChevronDown,
  Sparkles,
  Sliders,
  Laptop,
  Smartphone,
  Tablet,
  RotateCcw,
  AppWindow,
  Eye,
  Zap,
  HelpCircle,
  Users,
  Server,
  Workflow,
  FolderTree,
  Play,
  Undo2,
  Redo2,
  Layers,
  Columns2,
  Apple
} from 'lucide-react';
import { PersonaType, UserSettings } from '../types/chat';
import { WorkspaceView, AIProviderType, StudioWindowId, StudioWindowState } from '../types/workbench';
import { soundFx } from '../utils/audio';

interface StudioHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleCollapseSidebar: () => void;
  activeWorkspaceView: WorkspaceView;
  onChangeWorkspaceView: (view: WorkspaceView) => void;
  // Windows Management Dropdown & Actions
  windows: Record<StudioWindowId, StudioWindowState>;
  onToggleWindow: (id: StudioWindowId) => void;
  onToggleUndockWindow: (id: StudioWindowId) => void;
  onDockAllWindows: () => void;
  onResetWindowLayout: () => void;
  // File & Chat Actions
  onNewChat: () => void;
  onNewFile: () => void;
  onOpenWorkspaceFolder: () => void;
  workspaceRoot?: string;
  onDownloadFile: () => void;
  onClearChat: () => void;
  // Persona & Settings
  activePersona: PersonaType;
  onChangePersona: (p: PersonaType) => void;
  userSettings: UserSettings;
  activeProvider: AIProviderType;
  isConnected: boolean;
  onOpenSettings: () => void;
  onOpenLocalSettings: () => void;
  onOpenSupruTeam: () => void;
  onOpenShare: () => void;
  onOpenLogin: () => void;
  onOpenHelp: () => void;
  onOpenImageStudio: () => void;
  onOpenVeoStudio: () => void;
  onToggleSound: () => void;
  // Models & Studio Directives
  activeModelName?: string;
  onOpenConnectModel?: () => void;
  onOpenAddModels?: () => void;
  onOpenGetCode?: () => void;
  onSelectPresetTemplate?: (templateId: string) => void;
  onApplyDirective?: (directive: string) => void;
  deviceViewport?: 'desktop' | 'tablet' | 'mobile';
  onChangeDeviceViewport?: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
  onOpenMacOSInstall?: () => void;
}

export type StudioMenuCategory = 
  | 'workspaces' 
  | 'windows' 
  | 'models' 
  | 'presets' 
  | 'file' 
  | 'edit' 
  | 'view' 
  | 'help';

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onToggleSidebar,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
  activeWorkspaceView,
  onChangeWorkspaceView,
  windows,
  onToggleWindow,
  onToggleUndockWindow,
  onDockAllWindows,
  onResetWindowLayout,
  onNewChat,
  onNewFile,
  onOpenWorkspaceFolder,
  workspaceRoot,
  onDownloadFile,
  onClearChat,
  activePersona,
  onChangePersona,
  userSettings,
  activeProvider,
  isConnected,
  onOpenSettings,
  onOpenLocalSettings,
  onOpenSupruTeam,
  onOpenShare,
  onOpenLogin,
  onOpenHelp,
  onOpenImageStudio,
  onOpenVeoStudio,
  onToggleSound,
  activeModelName = 'Gemini 3.8 Flash',
  onOpenConnectModel,
  onOpenAddModels,
  onOpenGetCode,
  onSelectPresetTemplate,
  onApplyDirective,
  deviceViewport = 'desktop',
  onChangeDeviceViewport,
  onOpenMacOSInstall,
}) => {
  // Exactly ONE dropdown state for the entire header
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<StudioMenuCategory>('workspaces');
  const headerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action?: () => void) => {
    soundFx.playClick();
    if (action) {
      action();
    }
    setIsMenuOpen(false);
  };

  const personaMeta: Record<PersonaType, { label: string; icon: string }> = {
    supru_cat: { label: 'Supru Cat AI', icon: '🐾' },
    standard_ai: { label: 'Standard AI', icon: '⚡' },
    code_architect: { label: 'Code Architect', icon: '💻' },
    creative_writer: { label: 'Creative Writer', icon: '🎨' },
    sovereign_omni: { label: 'Sovereign Omni', icon: '🌌' },
  };

  const menuCategories: { id: StudioMenuCategory; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'workspaces', label: 'Workspaces', icon: Layers },
    { id: 'windows', label: 'Windows', icon: AppWindow },
    { id: 'models', label: 'AI & Models', icon: Zap },
    { id: 'presets', label: 'Presets', icon: Sparkles },
    { id: 'file', label: 'File', icon: FileCode },
    { id: 'edit', label: 'Edit', icon: Sliders },
    { id: 'view', label: 'View', icon: Eye },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  const workspacesList = [
    { id: 'generative', label: 'Supru Generative Studio', icon: Sparkles, iconColor: 'text-pink-400', desc: 'World-State Synthesis & Genesis Protocol', badge: 'Genesis' },
    { id: 'editor', label: 'Supru Code IDE', icon: Code2, iconColor: 'text-cyan-400', desc: 'Google AI Studio Code Editor & Sandbox Preview', badge: 'Live Studio' },
    { id: 'chat', label: 'Supru Chat', icon: MessageSquare, iconColor: 'text-sky-400', desc: 'Neural AI Dialogue & Reasoning' },
    { id: 'agent', label: 'Supru Hunter Agent', icon: Bot, iconColor: 'text-purple-400', desc: 'Rust Authority Gate & 8-Agent Pipeline', badge: 'Master' },
    { id: 'orchestrator', label: 'Model Orchestrator', icon: Workflow, iconColor: 'text-amber-400', desc: 'Autonomous Multi-Model Dispatch & Prover', badge: 'Omni' },
    { id: 'terminal', label: 'CLI Terminal Shell', icon: Terminal, iconColor: 'text-emerald-400', desc: 'Tauri Native Rust PTY Shell' },
    { id: 'github', label: 'GitHub Workspace', icon: GitBranch, iconColor: 'text-orange-400', desc: 'Git Repo, Commits, Branches & Diffs' },
    { id: 'topology', label: 'The Stratified Stack', icon: Layers, iconColor: 'text-purple-400', desc: 'Manifold ⊗ Formula • Zero-Friction Glider (v1.3.0)', badge: 'v1.3.0' },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 flex h-10 w-full items-center justify-between border-b border-white/[0.08] bg-[#07070d]/95 px-2 text-xs font-sans text-gray-300 backdrop-blur-2xl select-none"
    >
      {/* LEFT SECTION: BRAND & SINGLE UNIFIED DROPDOWN MENU */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/[0.08] hover:text-white lg:hidden"
          title="Toggle Sidebar"
        >
          <Menu size={14} />
        </button>

        {/* Desktop Collapse Sidebar Button */}
        <button
          onClick={onToggleCollapseSidebar}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white/[0.08] hover:text-white"
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={14} className="text-amber-400" /> : <PanelLeftClose size={14} />}
        </button>

        {/* App Logo & Name */}
        <div className="flex items-center gap-1.5 px-1 mr-1">
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Supru Ecosystem Icon"
            className="h-5 w-5 rounded-md object-cover border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          />
          <span className="font-extrabold tracking-tight text-white text-[11.5px] hidden sm:inline">
            SUPRU <span className="text-amber-400">ECOSYSTEM</span>
          </span>
          <span
            className={`h-2 w-2 rounded-full transition-all ${
              isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
            }`}
            title={isConnected ? 'Connected to Neural Core' : 'Connecting...'}
          />
        </div>

        {/* ======================================================== */}
        {/* THE SINGLE UNIFIED DROPDOWN MENU (No duplicates/repeats) */}
        {/* ======================================================== */}
        <div className="relative">
          <button
            onClick={() => {
              soundFx.playClick();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all shadow-sm ${
              isMenuOpen
                ? 'border-amber-500/80 bg-[#1a1a28] text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50'
                : 'border-white/[0.1] bg-[#0c0c14] text-gray-200 hover:border-amber-500/40 hover:bg-[#12121e]'
            }`}
            title="Studio Menu (Workspaces, Windows, AI Models, Presets, File, Edit, View, Help)"
          >
            <FolderTree size={13} className="text-amber-400" />
            <span className="font-bold text-white">Menu</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5 text-gray-300">
              {activeWorkspaceView === 'chat' && <MessageSquare size={12} className="text-sky-400" />}
              {activeWorkspaceView === 'generative' && <Sparkles size={12} className="text-pink-400" />}
              {activeWorkspaceView === 'editor' && <Code2 size={12} className="text-amber-400" />}
              {activeWorkspaceView === 'terminal' && <Terminal size={12} className="text-emerald-400" />}
              {activeWorkspaceView === 'agent' && <Bot size={12} className="text-purple-400" />}
              {activeWorkspaceView === 'github' && <GitBranch size={12} className="text-orange-400" />}
              {activeWorkspaceView === 'orchestrator' && <Workflow size={12} className="text-amber-400" />}
              {activeWorkspaceView === 'topology' && <Layers size={12} className="text-purple-400" />}
              <span className="font-medium text-white hidden sm:inline">
                {activeWorkspaceView === 'chat' && 'Chat'}
                {activeWorkspaceView === 'generative' && 'Generative Studio'}
                {activeWorkspaceView === 'editor' && 'Supru Code'}
                {activeWorkspaceView === 'terminal' && 'CLI'}
                {activeWorkspaceView === 'agent' && 'Hunter'}
                {activeWorkspaceView === 'github' && 'GitHub'}
                {activeWorkspaceView === 'orchestrator' && 'Orchestrator'}
                {activeWorkspaceView === 'topology' && 'Stratified'}
              </span>
            </span>
            <span className="text-[11px] hidden md:inline ml-0.5" title={`Persona: ${personaMeta[activePersona]?.label}`}>
              {personaMeta[activePersona]?.icon}
            </span>
            <ChevronDown
              size={11}
              className={`text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-amber-400' : ''}`}
            />
          </button>

          {/* THE SINGLE UNIFIED DROPDOWN PANEL */}
          {isMenuOpen && (
            <div className="absolute left-0 top-9 w-[340px] sm:w-[540px] max-w-[95vw] rounded-2xl border border-white/[0.12] bg-[#0d0d17]/98 p-2.5 shadow-2xl z-50 backdrop-blur-2xl animate-fadeIn text-xs">
              {/* Category Segmented Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-white/[0.08] scrollbar-thin">
                {menuCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = menuTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        soundFx.playClick();
                        setMenuTab(cat.id);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-sm'
                          : 'hover:bg-white/[0.06] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Icon size={12} className={isActive ? 'text-amber-400' : 'text-gray-400'} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Tab Content Area */}
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {/* 1. WORKSPACES */}
                {menuTab === 'workspaces' && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                      <span>Studio Engines & Workspaces</span>
                      <span className="text-gray-400 text-[9px] font-normal font-mono">7 Engines</span>
                    </div>
                    {workspacesList.map((ws) => {
                      const isSelected = activeWorkspaceView === ws.id;
                      const Icon = ws.icon;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => {
                            handleAction(() => onChangeWorkspaceView(ws.id as any));
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                            isSelected
                              ? 'bg-amber-500/15 border border-amber-500/40 text-white'
                              : 'hover:bg-white/[0.06] text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                              isSelected ? 'bg-amber-500/25 text-amber-300 border-amber-500/40' : 'bg-white/[0.04] border-white/[0.06]'
                            }`}>
                              <Icon size={14} className={ws.iconColor} />
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white">{ws.label}</span>
                                {ws.badge && (
                                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8.5px] font-mono text-amber-300 border border-amber-500/30">
                                    {ws.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 line-clamp-1">{ws.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check size={13} className="text-amber-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. WINDOWS */}
                {menuTab === 'windows' && (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                      <span>Studio Windows</span>
                      <span className="text-gray-400 text-[9px] font-normal">Toggle Open / Close</span>
                    </div>

                    {(Object.keys(windows) as StudioWindowId[]).map((winId) => {
                      const win = windows[winId];
                      return (
                        <button
                          key={winId}
                          onClick={() => {
                            soundFx.playClick();
                            onToggleWindow(winId);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${win.isOpen ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-gray-600'}`} />
                            <span className={win.isOpen ? 'font-medium text-white' : 'text-gray-400'}>{win.title}</span>
                          </div>
                          {win.isOpen && <Check size={12} className="text-amber-400" />}
                        </button>
                      );
                    })}

                    <div className="h-px bg-white/[0.06] my-1.5" />

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        onClick={() => handleAction(onResetWindowLayout)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <RotateCcw size={12} className="text-rose-400" />
                        <span>Reset Layout</span>
                      </button>

                      <button
                        onClick={() => handleAction(onDockAllWindows)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[11px] text-gray-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Columns2 size={12} className="text-amber-400" />
                        <span>Dock All</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. AI & MODELS */}
                {menuTab === 'models' && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                        Active Model
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{activeModelName}</span>
                        <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {onOpenAddModels && (
                        <button
                          onClick={() => handleAction(onOpenAddModels)}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold hover:bg-amber-500/25 transition-colors"
                        >
                          <Plus size={13} className="text-amber-400" />
                          <span>Add AI Model (With / Without Key)...</span>
                        </button>
                      )}

                      {onOpenConnectModel && (
                        <button
                          onClick={() => handleAction(onOpenConnectModel)}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-amber-300"
                        >
                          <Sliders size={13} />
                          <span>Configure External Models...</span>
                        </button>
                      )}

                      {onOpenLocalSettings && (
                        <button
                          onClick={() => handleAction(onOpenLocalSettings)}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                        >
                          <Server size={13} className="text-emerald-400" />
                          <span>Local AI Engine / Ollama Setup...</span>
                        </button>
                      )}

                      {onOpenGetCode && (
                        <button
                          onClick={() => handleAction(onOpenGetCode)}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                        >
                          <Code2 size={13} className="text-sky-400" />
                          <span>Get Code Export (Google AI Studio)</span>
                        </button>
                      )}
                    </div>

                    <div className="h-px bg-white/[0.06] my-1" />

                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        Select AI Persona
                      </div>
                      <div className="space-y-0.5">
                        {(Object.keys(personaMeta) as PersonaType[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => handleAction(() => onChangePersona(p))}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-all ${
                              activePersona === p
                                ? 'bg-purple-500/15 border border-purple-500/30 text-white'
                                : 'hover:bg-white/[0.06] text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{personaMeta[p].icon}</span>
                              <span className="font-medium">{personaMeta[p].label}</span>
                            </div>
                            {activePersona === p && <Check size={12} className="text-purple-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PRESETS & DIRECTIVES */}
                {menuTab === 'presets' && (
                  <div className="space-y-2">
                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Interactive Applets
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleAction(() => onSelectPresetTemplate?.('tpl-galaxy'))}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                        >
                          <span className="text-base">🌌</span>
                          <div>
                            <div className="font-semibold text-white">Neural Particle Galaxy</div>
                            <div className="text-[10px] text-gray-400">Canvas gravity & shockwaves</div>
                          </div>
                        </button>

                        <button
                          onClick={() => handleAction(() => onSelectPresetTemplate?.('tpl-synth'))}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                        >
                          <span className="text-base">🎛️</span>
                          <div>
                            <div className="font-semibold text-white">Web Audio Synthesizer</div>
                            <div className="text-[10px] text-gray-400">Live frequency visualizer</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-white/[0.06] my-1" />

                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                        <span>Chat Starters</span>
                        <span className="text-[9px] font-mono text-gray-400">4 Starters</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          {
                            title: 'Synthesize 3D Particle Galaxy',
                            desc: 'Interactive 60FPS canvas simulation with live preview',
                            icon: '🌌',
                            prompt: 'Build an interactive 3D particle constellation simulation with mouse gravity, color morphing, and shockwaves in HTML & Canvas.',
                          },
                          {
                            title: 'Autonomous AST Architecture Audit',
                            desc: 'Audit dependencies, find edge cases, and unit tests',
                            icon: '🎯',
                            prompt: 'Audit current codebase invariants, detect race conditions, and synthesize comprehensive automated unit tests.',
                          },
                          {
                            title: 'Animate Photos into Cinematic Video',
                            desc: 'High-fidelity fluid motion synthesis using Veo 3.1',
                            icon: '🎬',
                            prompt: 'Animate this cyberpunk scene into a 720p cinematic tracking shot with neon reflections and volumetric rain.',
                          },
                          {
                            title: 'Shor’s Quantum Computing Breakdown',
                            desc: 'Period-finding, modular math & superposition with feline genius',
                            icon: '🐾',
                            prompt: 'Explain Shor’s algorithm and quantum superposition like an unimpressed senior feline engineer with code snippets.',
                          },
                        ].map((starter, i) => (
                          <button
                            key={i}
                            onClick={() => handleAction(() => {
                              onChangeWorkspaceView('chat');
                              onApplyDirective?.(starter.prompt);
                            })}
                            className="flex w-full items-start gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200 transition-colors"
                          >
                            <span className="text-sm mt-0.5">{starter.icon}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-white text-xs truncate">{starter.title}</div>
                              <div className="text-[10px] text-gray-400 truncate">{starter.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/[0.06] my-1" />

                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        Prompt Directives
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { label: 'Particle Shockwave', icon: '🌌', prompt: 'Add fluid mouse interactive physics and particle shockwaves to this app' },
                          { label: 'Neon Glass Theme', icon: '🎨', prompt: 'Enhance UI with sleek dark neon cyberpunk glassmorphism theme' },
                          { label: '60FPS Optimization', icon: '⚡', prompt: 'Audit and optimize 60FPS animation loops, avoid layout thrashing' },
                          { label: 'Web Audio Sound FX', icon: '🔊', prompt: 'Add Web Audio sound effects on click or user interaction' },
                        ].map((dir, i) => (
                          <button
                            key={i}
                            onClick={() => handleAction(() => onApplyDirective?.(dir.prompt))}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                          >
                            <span>{dir.icon}</span>
                            <span>{dir.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. FILE */}
                {menuTab === 'file' && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleAction(onOpenWorkspaceFolder)}
                      className="flex w-full items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-2 text-left hover:bg-emerald-500/[0.12] text-gray-100"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FolderTree size={14} className="shrink-0 text-emerald-400" />
                        <span className="truncate">{workspaceRoot ? 'Change Project Folder' : 'Open Project Folder…'}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">⌘O</span>
                    </button>
                    {workspaceRoot && (
                      <div className="truncate px-2.5 pb-1 text-[10px] text-emerald-300/80" title={workspaceRoot}>
                        Active project: {workspaceRoot}
                      </div>
                    )}
                    <button
                      onClick={() => handleAction(onNewChat)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-amber-400" />
                        <span>New Chat</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⌘N</span>
                    </button>

                    <button
                      onClick={() => {
                        onChangeWorkspaceView('editor');
                        handleAction(onNewFile);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <FileCode size={14} className="text-emerald-400" />
                        <span>New Code File</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⇧⌘N</span>
                    </button>

                    <button
                      onClick={() => handleAction(onDownloadFile)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Download size={14} className="text-sky-400" />
                        <span>Save / Download Code</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⌘S</span>
                    </button>

                    <div className="h-px bg-white/[0.06] my-1" />

                    <button
                      onClick={() => handleAction(onClearChat)}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-rose-500/10 text-rose-300"
                    >
                      <Trash2 size={14} />
                      <span>Clear Current Chat</span>
                    </button>
                  </div>
                )}

                {/* 6. EDIT */}
                {menuTab === 'edit' && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleAction(() => document.execCommand('undo'))}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Undo2 size={14} className="text-gray-400" />
                        <span>Undo</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⌘Z</span>
                    </button>

                    <button
                      onClick={() => handleAction(() => document.execCommand('redo'))}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Redo2 size={14} className="text-gray-400" />
                        <span>Redo</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⇧⌘Z</span>
                    </button>

                    <button
                      onClick={() => handleAction(() => {
                        window.dispatchEvent(new CustomEvent('supru-format-code'));
                      })}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Sliders size={14} className="text-amber-400" />
                        <span>Format Code</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⇧⌥F</span>
                    </button>
                  </div>
                )}

                {/* 7. VIEW */}
                {menuTab === 'view' && (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction(onToggleCollapseSidebar)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <PanelLeftOpen size={14} className="text-amber-400" />
                        <span>{isSidebarCollapsed ? 'Show Sidebar Tab' : 'Hide Sidebar Tab'}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">⌘B</span>
                    </button>

                    <button
                      onClick={() => handleAction(() => {
                        if (!document.fullscreenElement) {
                          document.documentElement.requestFullscreen?.();
                        } else {
                          document.exitFullscreen?.();
                        }
                      })}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 size={14} className="text-purple-400" />
                        <span>Toggle Fullscreen</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">F11</span>
                    </button>

                    <div className="h-px bg-white/[0.06] my-1" />
                    <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Device Viewport
                    </div>

                    <button
                      onClick={() => handleAction(() => onChangeDeviceViewport?.('desktop'))}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Laptop size={12} />
                        <span>Desktop (100%)</span>
                      </div>
                      {deviceViewport === 'desktop' && <Check size={12} className="text-amber-400" />}
                    </button>

                    <button
                      onClick={() => handleAction(() => onChangeDeviceViewport?.('tablet'))}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Tablet size={12} />
                        <span>Tablet (768px)</span>
                      </div>
                      {deviceViewport === 'tablet' && <Check size={12} className="text-amber-400" />}
                    </button>

                    <button
                      onClick={() => handleAction(() => onChangeDeviceViewport?.('mobile'))}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone size={12} />
                        <span>Mobile (375px)</span>
                      </div>
                      {deviceViewport === 'mobile' && <Check size={12} className="text-amber-400" />}
                    </button>

                    <div className="h-px bg-white/[0.06] my-1" />

                    <button
                      onClick={() => handleAction(onToggleSound)}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {userSettings.soundEffects ? <Volume2 size={13} className="text-amber-400" /> : <VolumeX size={13} />}
                        <span>Sound Effects</span>
                      </div>
                      {userSettings.soundEffects && <Check size={12} className="text-amber-400" />}
                    </button>
                  </div>
                )}

                {/* 8. HELP & SQUAD */}
                {menuTab === 'help' && (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction(onOpenSupruTeam)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-amber-300"
                    >
                      <Users size={14} />
                      <div>
                        <div className="font-semibold text-white">Supru Team Squad</div>
                        <div className="text-[10px] text-gray-400">Manage autonomous AI agent team members</div>
                      </div>
                    </button>

                    {onOpenImageStudio && (
                      <button
                        onClick={() => handleAction(onOpenImageStudio)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                      >
                        <Sparkles size={14} className="text-emerald-400" />
                        <div>
                          <div className="font-semibold text-white">Vision Studio</div>
                          <div className="text-[10px] text-gray-400">AI image generation & editing</div>
                        </div>
                      </button>
                    )}

                    {onOpenVeoStudio && (
                      <button
                        onClick={() => handleAction(onOpenVeoStudio)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                      >
                        <Zap size={14} className="text-sky-400" />
                        <div>
                          <div className="font-semibold text-white">Veo Motion Studio</div>
                          <div className="text-[10px] text-gray-400">Cinematic video animation</div>
                        </div>
                      </button>
                    )}

                    <div className="h-px bg-white/[0.06] my-1" />

                    <button
                      onClick={() => handleAction(onOpenHelp)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-white/[0.08] text-gray-200"
                    >
                      <HelpCircle size={14} className="text-sky-400" />
                      <div>
                        <div className="font-semibold text-white">Documentation & Shortcuts</div>
                        <div className="text-[10px] text-gray-400">Guides, keyboard shortcuts & FAQs</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: MODEL BADGE & QUICK ACCESS ICONS */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Button for Supru Generative Studio (User Request) */}
        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('generative');
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-sm ${
            activeWorkspaceView === 'generative'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)] font-extrabold'
              : 'border border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-400'
          }`}
          title="Open Supru AI Generative Studio"
        >
          <Sparkles size={13} className="text-pink-400" />
          <span>Generative Studio</span>
        </button>

        {/* Button to Link Supru Code (User Request) */}
        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('editor');
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
            activeWorkspaceView === 'editor'
              ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
              : 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400'
          }`}
          title="Open Supru Code Studio"
        >
          <Code2 size={13} />
          <span className="hidden sm:inline">Supru Code</span>
        </button>

        {/* Active Connected Model Capsule / Add Models */}
        <button
          onClick={onOpenAddModels || onOpenConnectModel}
          className="hidden md:flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#12121b] px-2 py-1 text-[11px] text-gray-300 hover:border-amber-500/40 hover:text-white transition-colors"
          title="Configured AI Model (Click to add or configure models with/without key)"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-medium text-amber-300">{activeModelName}</span>
        </button>

        {/* Install macOS App (.dmg) Button */}
        {onOpenMacOSInstall && (
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenMacOSInstall();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 text-xs font-semibold text-gray-200 hover:text-white transition-all hover:border-white/20 active:scale-95"
            title="Install Supru Generative Studio on macOS (.dmg / Dock)"
          >
            <Apple size={13} className="text-white" />
            <span className="hidden lg:inline text-[11px]">Install .dmg</span>
          </button>
        )}

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Share Project / Thread"
        >
          <Share2 size={13} />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-white/[0.08] hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={13} />
        </button>
      </div>
    </header>
  );
};
