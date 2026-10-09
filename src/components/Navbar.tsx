import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Share2, 
  MoreHorizontal, 
  Menu, 
  Trash2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Check, 
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
  Code2,
  Bot,
  GitBranch,
  Server,
  MessageSquare,
  Users
} from 'lucide-react';
import { PersonaType, UserSettings } from '../types/chat';
import { WorkspaceView, AIProviderType } from '../types/workbench';
import { soundFx } from '../utils/audio';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenShare: () => void;
  onClearCurrentChat: () => void;
  onOpenConnect: () => void;
  onOpenSettings: () => void;
  onOpenLocalSettings: () => void;
  onOpenSupruTeam: () => void;
  onOpenImageStudio: () => void;
  onOpenVeoStudio: () => void;
  activePersona: PersonaType;
  onChangePersona: (p: PersonaType) => void;
  userSettings: UserSettings;
  onToggleSound: () => void;
  onGlobalSearch: (query: string) => void;
  hasActiveMessages: boolean;
  isConnected: boolean;
  isSidebarCollapsed: boolean;
  onToggleCollapseSidebar: () => void;
  activeWorkspaceView: WorkspaceView;
  onChangeWorkspaceView: (view: WorkspaceView) => void;
  activeProvider: AIProviderType;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenShare,
  onClearCurrentChat,
  onOpenConnect,
  onOpenSettings,
  onOpenLocalSettings,
  onOpenSupruTeam,
  onOpenImageStudio,
  onOpenVeoStudio,
  activePersona,
  onChangePersona,
  userSettings,
  onToggleSound,
  onGlobalSearch,
  hasActiveMessages,
  isConnected,
  isSidebarCollapsed,
  onToggleCollapseSidebar,
  activeWorkspaceView,
  onChangeWorkspaceView,
  activeProvider,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onGlobalSearch(searchVal.trim());
    }
  };

  const personaMeta: Record<PersonaType, { label: string; icon: string; desc: string }> = {
    supru_cat: { label: 'Supru Cat AI', icon: '🐾', desc: 'Witty, brilliant feline genius' },
    standard_ai: { label: 'Standard AI', icon: '⚡', desc: 'Direct, crisp & concise' },
    code_architect: { label: 'Code Architect', icon: '💻', desc: 'Principal software engineering' },
    creative_writer: { label: 'Creative Writer', icon: '🎨', desc: 'Vivid fiction & storytelling' },
    sovereign_omni: { label: 'Sovereign Omni', icon: '🌌', desc: 'Tiered Consciousness & Genesis Protocol' },
  };

  const providerLabels: Record<AIProviderType, { label: string; color: string }> = {
    gemini_cloud: { label: 'Cloud Gemini', color: 'text-amber-400 border-amber-500/30' },
    ollama_local: { label: 'Ollama Localhost', color: 'text-emerald-400 border-emerald-500/30' },
    lmstudio_local: { label: 'LM Studio', color: 'text-sky-400 border-sky-500/30' },
    custom_local: { label: 'Custom Local', color: 'text-purple-400 border-purple-500/30' },
    offline_core: { label: 'Smart Core', color: 'text-amber-300 border-amber-400/30' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#07070d]/90 px-3 sm:px-5 backdrop-blur-2xl">
      {/* Left side: Collapse toggle + Persona badge */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-white/[0.08] hover:text-white lg:hidden"
          title="Toggle Sidebar"
        >
          <Menu size={16} />
        </button>

        {/* Desktop Collapsible Left Side Panel Tab button */}
        <button
          onClick={onToggleCollapseSidebar}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white border border-white/[0.08]"
          title={isSidebarCollapsed ? 'Expand side panel tab (Ctrl+B)' : 'Collapse side panel tab (Ctrl+B)'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={15} className="text-amber-400" /> : <PanelLeftClose size={15} />}
        </button>

        {/* When sidebar is collapsed on desktop, show the Cat avatar + Supru Ecosystem + green spot */}
        {isSidebarCollapsed && (
          <div className="hidden lg:flex items-center gap-2 pl-1 pr-2.5 border-r border-white/[0.08]">
            <img
              src="/cat_icon.png"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
              alt="Supru Ecosystem"
              className="h-7 w-7 rounded-xl object-cover border border-amber-500/40 shadow-sm"
            />
            <span className="font-extrabold text-[#f59e0b] text-xs">Supru Ecosystem</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
              title={isConnected ? 'Connected to Core' : 'Offline'}
            />
          </div>
        )}

        {/* Persona Selector Dropdown */}
        <div className="relative" ref={personaRef}>
          <button
            onClick={() => {
              soundFx.playClick();
              setShowPersonaMenu(!showPersonaMenu);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-500/20"
          >
            <span>{personaMeta[activePersona].icon}</span>
            <span className="hidden sm:inline">{personaMeta[activePersona].label}</span>
          </button>

          {showPersonaMenu && (
            <div className="absolute left-0 mt-2 w-56 rounded-2xl border border-white/[0.1] bg-[#12121c]/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                AI Personality Mode
              </div>
              <div className="space-y-0.5 mt-0.5">
                {(Object.keys(personaMeta) as PersonaType[]).map((pKey) => {
                  const item = personaMeta[pKey];
                  const isSelected = activePersona === pKey;
                  return (
                    <button
                      key={pKey}
                      onClick={() => {
                        soundFx.playClick();
                        onChangePersona(pKey);
                        setShowPersonaMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-300 font-semibold'
                          : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <div>
                          <div className="font-medium text-[11.5px]">{item.label}</div>
                          <div className="text-[9.5px] text-gray-400">{item.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={13} className="text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Supru Team Squad Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenSupruTeam();
          }}
          className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
          title="Open Supru Team Squad"
        >
          <Users size={12} />
          <span className="hidden md:inline">Supru Team</span>
        </button>

        {/* AI Provider Pill */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenLocalSettings();
          }}
          className={`hidden xl:flex items-center gap-1.5 rounded-xl border bg-[#11111a] px-2.5 py-1 text-[10.5px] font-semibold transition-all hover:bg-[#1a1a24] ${providerLabels[activeProvider].color}`}
          title="Switch Cloud vs Localhost models (Ollama, LM Studio)"
        >
          <Server size={11} />
          <span>{providerLabels[activeProvider].label}</span>
        </button>
      </div>

      {/* Center: 2027 Futuristic Workspace Switcher Dock */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.09] bg-[#101018]/90 backdrop-blur-xl p-1 text-xs shadow-lg">
        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('chat');
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-semibold transition-all ${
            activeWorkspaceView === 'chat'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Supru Chat"
        >
          <MessageSquare size={13} />
          <span className="hidden sm:inline">Chat</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('editor');
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-semibold transition-all ${
            activeWorkspaceView === 'editor'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Supru Code (IDE + Live Sandbox)"
        >
          <Code2 size={13} />
          <span className="hidden sm:inline">Code</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('terminal');
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-semibold transition-all ${
            activeWorkspaceView === 'terminal'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Supru CLI (Shell)"
        >
          <Terminal size={13} />
          <span className="hidden sm:inline">CLI</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('agent');
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-semibold transition-all ${
            activeWorkspaceView === 'agent'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Supru Hunter"
        >
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Hunter"
            className="h-3.5 w-3.5 rounded object-cover"
          />
          <span className="hidden sm:inline">Hunter</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('github');
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1 font-semibold transition-all ${
            activeWorkspaceView === 'github'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Supru Git"
        >
          <GitBranch size={13} />
          <span className="hidden sm:inline">Git</span>
        </button>
      </div>

      {/* Right Action buttons: Sound, Share, ..., Studios */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Quick Studios */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenImageStudio();
          }}
          className="hidden xl:flex items-center gap-1 rounded-full border border-amber-500/25 bg-[#171722] px-2.5 py-1 text-[10.5px] font-semibold text-amber-200 hover:border-amber-400"
          title="Supru Vision: Image Studio"
        >
          <Sparkles size={11} className="text-amber-400" />
          <span>Vision</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onOpenVeoStudio();
          }}
          className="hidden xl:flex items-center gap-1 rounded-full border border-orange-500/25 bg-[#171722] px-2.5 py-1 text-[10.5px] font-semibold text-orange-200 hover:border-orange-400"
          title="Supru Motion: Veo Animation Studio"
        >
          <span className="text-[11px]">🎬</span>
          <span>Motion</span>
        </button>

        {/* Sound toggle button */}
        <button
          onClick={onToggleSound}
          title={userSettings.soundEffects ? 'Mute Sound FX' : 'Enable Sound FX'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#242430] bg-[#14141a] text-gray-400 hover:text-white"
        >
          {userSettings.soundEffects ? (
            <Volume2 size={14} className="text-amber-400" />
          ) : (
            <VolumeX size={14} className="text-gray-500" />
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenShare();
          }}
          className="flex items-center gap-1 rounded-full border border-[#2b2b36] bg-[#16161f] px-2.5 py-1 text-[11px] font-semibold text-white hover:border-amber-500/40"
        >
          <Share2 size={12} className="text-gray-300" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* More options menu (...) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              soundFx.playClick();
              setShowMoreMenu(!showMoreMenu);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2b2b36] bg-[#16161f] text-gray-300 hover:border-amber-500/40 hover:text-white"
            title="More Options"
          >
            <MoreHorizontal size={15} />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#2b2b36] bg-[#14141c] p-1.5 shadow-2xl z-50 text-xs">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenSupruTeam();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-bold text-amber-300 hover:bg-amber-500/10"
              >
                <Users size={13} />
                <span>Supru Team Squad</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenLocalSettings();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Server size={13} className="text-emerald-400" />
                <span>AI Engine / Localhost</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenImageStudio();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>Supru Vision Studio</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenVeoStudio();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                <span className="text-xs">🎬</span>
                <span>Supru Motion (Veo 3.1)</span>
              </button>

              {hasActiveMessages && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onClearCurrentChat();
                    setShowMoreMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 size={13} />
                  <span>Clear Conversation</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundFx.playClick();
                  onOpenSettings();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Info size={13} className="text-amber-400" />
                <span>Preferences</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
