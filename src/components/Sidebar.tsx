import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Trash2, 
  Pin, 
  Edit3,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Code2,
  Bot,
  GitBranch,
  Server,
  Users,
  Workflow,
  Layers,
  Sparkles,
  Zap,
  Cpu,
  Activity,
  Compass,
  Sliders,
  Maximize2,
  Apple
} from 'lucide-react';
import { ChatThread, UserSettings } from '../types/chat';
import { WorkspaceView } from '../types/workbench';
import { soundFx } from '../utils/audio';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  onTogglePinThread: (id: string) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenLogin: () => void;
  onOpenConnect: () => void;
  onOpenLocalSettings: () => void;
  onOpenSupruTeam: () => void;
  onOpenImageStudio: () => void;
  onOpenVeoStudio: () => void;
  isConnected: boolean;
  userSettings: UserSettings;
  isOpen: boolean;
  onToggleOpen: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeWorkspaceView: WorkspaceView;
  onChangeWorkspaceView: (view: WorkspaceView) => void;
  sidebarWidth?: number;
  onUpdateSidebarWidth?: (w: number) => void;
  onOpenMacOSInstall?: () => void;
}

interface SovereignGlyphItem {
  id: WorkspaceView;
  label: string;
  tag: string;
  icon: React.FC<{ size?: number; className?: string }>;
  accentColor: string;
  glowColor: string;
}

const SOVEREIGN_GLYPHS: SovereignGlyphItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    tag: 'Sovereign Chat',
    icon: MessageSquare,
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'generative',
    label: 'Studio',
    tag: 'Generative Studio',
    icon: Sparkles,
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },
  {
    id: 'editor',
    label: 'Code',
    tag: 'Supru Code IDE',
    icon: Code2,
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'terminal',
    label: 'CLI',
    tag: 'Sovereign Shell',
    icon: Terminal,
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'agent',
    label: 'Hunter',
    tag: 'Autonomous Agent',
    icon: Bot,
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    id: 'github',
    label: 'Warrior',
    tag: 'Warrior Git',
    icon: GitBranch,
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'orchestrator',
    label: 'Akhada',
    tag: 'Multi-Agent Arena',
    icon: Workflow,
    accentColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.4)',
  },
  {
    id: 'topology',
    label: 'Galaxy',
    tag: 'Stratified Stack',
    icon: Layers,
    accentColor: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.4)',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onTogglePinThread,
  onOpenSettings,
  onOpenHelp,
  onOpenLogin,
  onOpenConnect,
  onOpenLocalSettings,
  onOpenSupruTeam,
  onOpenImageStudio,
  onOpenVeoStudio,
  isConnected,
  userSettings,
  isOpen,
  onToggleOpen,
  isCollapsed,
  onToggleCollapse,
  activeWorkspaceView,
  onChangeWorkspaceView,
  sidebarWidth = 280,
  onUpdateSidebarWidth,
  onOpenMacOSInstall,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredGlyph, setHoveredGlyph] = useState<string | null>(null);
  const [showChatTray, setShowChatTray] = useState(true);

  // Resize handler
  const handleSidebarResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      onUpdateSidebarWidth?.(Math.max(220, Math.min(460, clientX)));
    };
    const handleStop = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleStop);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleStop);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleStop);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleStop);
  };

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRename = (thread: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  const handleSaveRename = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameThread(threadId, editingTitle.trim());
    }
    setEditingThreadId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(null);
  };

  const getRealmName = (view: WorkspaceView) => {
    switch (view) {
      case 'chat': return 'Chat';
      case 'generative': return 'Generative Studio';
      case 'editor': return 'Code';
      case 'terminal': return 'CLI';
      case 'agent': return 'Hunter';
      case 'github': return 'Warrior';
      case 'orchestrator': return 'Akhada';
      case 'topology': return 'Galaxy';
      default: return 'Sovereign';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
          onClick={onToggleOpen}
        />
      )}

      {/* SOVEREIGN LEFT PANEL */}
      <aside
        style={{
          width: isCollapsed ? '64px' : `${sidebarWidth}px`,
        }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-white/[0.08] bg-[#050509]/95 text-[#e5e7eb] backdrop-blur-3xl transition-all duration-300 ease-out select-none lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* =========================================================================
            TIER 1: THE IDENTITY (TOP)
            ========================================================================= */}
        <div className="relative border-b border-white/[0.06] p-3 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* The Profile: Glowing Avatar with Sovereign Aura */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-300 opacity-60 blur-sm group-hover:opacity-90 transition-opacity" />
              <img
                src="/cat_icon.png"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
                alt="Sovereign Identity"
                className="relative h-9 w-9 rounded-xl object-cover border border-amber-400/80 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-black shadow-[0_0_8px_#34d399]" />
            </div>

            {/* The Identity Details & The Realm Indicator */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs tracking-wider text-white uppercase truncate font-sans">
                    SUPRU
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    SOVEREIGN
                  </span>
                </div>
                {/* The Realm: current active Workspace */}
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium text-gray-300">
                    Workspace: <strong className="text-amber-300">{getRealmName(activeWorkspaceView)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Collapse/Expand Glide Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              onToggleCollapse();
            }}
            title={isCollapsed ? 'Expand Sovereign Panel' : 'Glide to Compact Dock'}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.1] hover:border-amber-400/40 transition-all shrink-0"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* =========================================================================
            TIER 2: THE GLIDE-NAV (THE CORE)
            Included Glyphs: Chat, Studio, Code, CLI, Hunter, Warrior, Akhada, Galaxy
            ========================================================================= */}
        <div className="py-2.5 px-2 border-b border-white/[0.06] bg-black/30">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[9px] font-mono uppercase tracking-widest text-gray-500 font-bold flex items-center justify-between">
              <span>Sovereign Glyphs</span>
              <span className="text-amber-400/80 font-normal">8 Modules</span>
            </div>
          )}

          {/* Vertical Glyph-Bar */}
          <div className="space-y-1">
            {SOVEREIGN_GLYPHS.map((glyph) => {
              const Icon = glyph.icon;
              const isActive = activeWorkspaceView === glyph.id;
              const isHovered = hoveredGlyph === glyph.id;

              return (
                <div key={glyph.id} className="relative group">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onChangeWorkspaceView(glyph.id);
                    }}
                    onMouseEnter={() => setHoveredGlyph(glyph.id)}
                    onMouseLeave={() => setHoveredGlyph(null)}
                    style={{
                      borderColor: isActive ? glyph.accentColor : 'transparent',
                      boxShadow: isActive ? `0 0 16px ${glyph.glowColor}` : undefined,
                    }}
                    className={`relative flex items-center gap-2.5 w-full rounded-xl transition-all duration-200 ${
                      isCollapsed ? 'justify-center p-2.5 h-10' : 'px-3 py-2 text-left'
                    } ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-semibold border'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    {/* Active Glide Pill Indicator */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                        style={{ backgroundColor: glyph.accentColor }}
                      />
                    )}

                    {/* Sovereign Glyph Icon with Ambient Glow on active */}
                    <div
                      className="relative shrink-0 flex items-center justify-center"
                      style={{ color: isActive ? glyph.accentColor : undefined }}
                    >
                      <Icon size={17} className="transition-transform group-hover:scale-110" />
                    </div>

                    {/* Module Title & Tag (Expanded mode) */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="text-xs truncate font-medium">{glyph.label}</span>
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded border transition-colors shrink-0 ml-1.5"
                          style={{
                            borderColor: isActive ? `${glyph.accentColor}60` : 'rgba(255,255,255,0.08)',
                            color: isActive ? glyph.accentColor : '#9ca3af',
                            backgroundColor: isActive ? `${glyph.accentColor}15` : 'transparent',
                          }}
                        >
                          {glyph.tag}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Compact Hover Tooltip (Shown in Collapsed mode) */}
                  {isCollapsed && isHovered && (
                    <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-xl border border-white/[0.12] bg-[#0f0f18]/95 backdrop-blur-xl px-3 py-1.5 shadow-2xl animate-fadeIn">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span style={{ color: glyph.accentColor }}>{glyph.label}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({glyph.tag})</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            CHAT THREADS DRAWER (Active only in Chat mode when expanded)
            ========================================================================= */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-2 pt-2">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 font-bold">
                Chat Stream
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onChangeWorkspaceView('chat');
                  onNewChat();
                }}
                className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-all"
                title="Create New Sovereign Chat"
              >
                <Plus size={11} />
                <span>New</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2 px-1">
              <Search size={11} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search streams..."
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-7 pr-2 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400/50"
              />
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 px-1 pb-2">
              {filteredThreads.slice(0, 15).map((thread) => {
                const isActive = activeThreadId === thread.id && activeWorkspaceView === 'chat';
                const isEditing = editingThreadId === thread.id;

                if (isEditing) {
                  return (
                    <div
                      key={thread.id}
                      className="flex items-center gap-1 rounded-lg border border-amber-500/50 bg-[#14141f] p-1 text-xs"
                    >
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-transparent px-1.5 text-xs text-white outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(thread.id, e as any);
                          if (e.key === 'Escape') handleCancelRename(e as any);
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveRename(thread.id, e)}
                        className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded text-gray-400 hover:bg-white/10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={thread.id}
                    onClick={() => {
                      soundFx.playClick();
                      onChangeWorkspaceView('chat');
                      onSelectThread(thread.id);
                    }}
                    className={`group relative flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <MessageSquare
                        size={12}
                        className={`shrink-0 ${isActive ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-400'}`}
                      />
                      <span className="truncate">{thread.title || 'Untitled Stream'}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinThread(thread.id);
                        }}
                        className={`p-1 rounded hover:bg-white/10 ${
                          thread.isPinned ? 'text-amber-400' : 'text-gray-500 hover:text-white'
                        }`}
                        title={thread.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={10} className={thread.isPinned ? 'fill-amber-400' : ''} />
                      </button>
                      <button
                        onClick={(e) => handleStartRename(thread, e)}
                        className="p-1 rounded text-gray-500 hover:bg-white/10 hover:text-white"
                        title="Rename"
                      >
                        <Edit3 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        className="p-1 rounded text-gray-500 hover:bg-rose-500/20 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsed spacer */}
        {isCollapsed && <div className="flex-1" />}

        {/* =========================================================================
            TIER 3: THE ENGINE ROOM (BOTTOM-MIDDLE)
            - The Pulse: status bar showing AI Engine Status
            - The Resource Monitor: tiny glowing line showing GPU / RAM usage
            ========================================================================= */}
        <div className="border-t border-white/[0.06] p-2.5 bg-black/40">
          {!isCollapsed ? (
            <div className="space-y-2">
              {/* The Pulse */}
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-gray-300 font-medium">Gemini 3.8 / Llama-3</span>
                </div>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              </div>

              {/* The Resource Monitor */}
              <div className="px-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>GPU • VRAM • RAM</span>
                  <span className="text-amber-400">120 FPS Glider</span>
                </div>
                <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 w-2/5" />
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed Pulse icon */
            <div className="flex justify-center" title="Engine Pulse: Ready (120 FPS Glider)">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
          )}
        </div>

        {/* =========================================================================
            TIER 4: THE SYSTEM BASE (BOTTOM)
            The Utility Hub: Minimalist low-opacity icons for Preferences, Help, Team
            ========================================================================= */}
        <div className="border-t border-white/[0.06] p-2 flex items-center justify-around bg-gradient-to-t from-white/[0.02] to-transparent">
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenSettings();
            }}
            title="Preferences"
            className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Settings size={15} />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenLocalSettings();
            }}
            title="AI Engine Models & Endpoints"
            className="p-2 rounded-xl text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Server size={15} />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenSupruTeam();
            }}
            title="Supru Team Ecosystem"
            className="p-2 rounded-xl text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <Users size={15} />
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onOpenHelp();
            }}
            title="Documentation & Help"
            className="p-2 rounded-xl text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <HelpCircle size={15} />
          </button>

          {onOpenMacOSInstall && (
            <button
              onClick={() => {
                soundFx.playClick();
                onOpenMacOSInstall();
              }}
              title="Install Native macOS Desktop App (.dmg)"
              className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Apple size={15} />
            </button>
          )}
        </div>

        {/* Resizable Draggable Handle for Desktop */}
        {!isCollapsed && onUpdateSidebarWidth && (
          <div
            onMouseDown={handleSidebarResizeStart}
            onTouchStart={handleSidebarResizeStart}
            className="hidden lg:block absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-amber-500/40 transition-colors z-40"
          />
        )}
      </aside>
    </>
  );
};
