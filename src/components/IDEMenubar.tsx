import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCode, 
  Edit3, 
  Eye, 
  Terminal, 
  HelpCircle, 
  Users, 
  Save, 
  Download, 
  Copy, 
  Trash2, 
  PanelLeft, 
  SplitSquareVertical, 
  Columns2, 
  Maximize2, 
  Bot, 
  Code2, 
  GitBranch, 
  MessageSquare, 
  Wand2, 
  Film, 
  Server, 
  Zap,
  Check,
  ChevronDown,
  Layers
} from 'lucide-react';
import { WorkspaceView, CodingSpaceLayout } from '../types/workbench';
import { soundFx } from '../utils/audio';

interface IDEMenubarProps {
  onNewChat: () => void;
  onNewFile: () => void;
  onDownloadFile: () => void;
  onClearChat: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  activeWorkspaceView: WorkspaceView;
  onChangeWorkspaceView: (view: WorkspaceView) => void;
  codingLayout: CodingSpaceLayout;
  onChangeCodingLayout: (layout: CodingSpaceLayout) => void;
  onOpenSupruTeam: () => void;
  onOpenLocalSettings: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenImageStudio: () => void;
  onOpenVeoStudio: () => void;
}

export const IDEMenubar: React.FC<IDEMenubarProps> = ({
  onNewChat,
  onNewFile,
  onDownloadFile,
  onClearChat,
  onToggleSidebar,
  isSidebarCollapsed,
  activeWorkspaceView,
  onChangeWorkspaceView,
  codingLayout,
  onChangeCodingLayout,
  onOpenSupruTeam,
  onOpenLocalSettings,
  onOpenSettings,
  onOpenHelp,
  onOpenImageStudio,
  onOpenVeoStudio,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    soundFx.playClick();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleAction = (fn: () => void) => {
    soundFx.playClick();
    fn();
    setActiveMenu(null);
  };

  return (
    <div
      ref={menuContainerRef}
      className="flex h-7 w-full items-center justify-between border-b border-white/[0.06] bg-[#06060a]/90 backdrop-blur-xl px-2.5 text-[11px] font-sans text-gray-300 select-none z-40"
    >
      {/* Left Menu Items */}
      <div className="flex items-center gap-0.5">
        {/* Supru Logo Brand Tag with Cat Avatar */}
        <div className="flex items-center gap-1.5 px-1.5 font-bold text-amber-400 text-[11px] mr-1">
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Supru"
            className="h-4 w-4 rounded-md object-cover border border-amber-400/50 shadow-sm"
          />
          <span className="text-gradient-amber font-extrabold tracking-tight font-sans">SUPRU ECOSYSTEM</span>
        </div>

        {/* 1. FILE MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            className={`rounded px-2 py-0.5 transition-colors ${
              activeMenu === 'file' ? 'bg-[#222230] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            File
          </button>

          {activeMenu === 'file' && (
            <div className="absolute left-0 top-7 w-52 rounded-xl border border-[#272738] bg-[#12121b] p-1 shadow-2xl z-50">
              <button
                onClick={() => handleAction(onNewChat)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-amber-400" />
                  <span>New Chat</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">⌘N</span>
              </button>

              <button
                onClick={() => {
                  onChangeWorkspaceView('editor');
                  handleAction(onNewFile);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <FileCode size={13} className="text-emerald-400" />
                  <span>New Code File</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">⇧⌘N</span>
              </button>

              <button
                onClick={() => handleAction(onDownloadFile)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Download size={13} className="text-sky-400" />
                  <span>Save / Export File</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">⌘S</span>
              </button>

              <div className="h-px bg-[#222230] my-1" />

              <button
                onClick={() => handleAction(onOpenSettings)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Preferences</span>
                <span className="text-[10px] text-gray-500 font-mono">⌘,</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            className={`rounded px-2 py-0.5 transition-colors ${
              activeMenu === 'edit' ? 'bg-[#222230] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            Edit
          </button>

          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-7 w-52 rounded-xl border border-[#272738] bg-[#12121b] p-1 shadow-2xl z-50">
              <button
                onClick={() => handleAction(() => {
                  try { document.execCommand('undo'); } catch {}
                })}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Undo</span>
                <span className="text-[10px] text-gray-500 font-mono">⌘Z</span>
              </button>

              <button
                onClick={() => handleAction(() => {
                  try { document.execCommand('redo'); } catch {}
                })}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Redo</span>
                <span className="text-[10px] text-gray-500 font-mono">⇧⌘Z</span>
              </button>

              <div className="h-px bg-[#222230] my-1" />

              <button
                onClick={() => handleAction(onClearChat)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-rose-500/15 text-rose-300"
              >
                <Trash2 size={13} />
                <span>Clear Chat History</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. VIEW & WINDOW REARRANGEMENT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            className={`rounded px-2 py-0.5 transition-colors ${
              activeMenu === 'view' ? 'bg-[#222230] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            View
          </button>

          {activeMenu === 'view' && (
            <div className="absolute left-0 top-7 w-60 rounded-xl border border-[#272738] bg-[#12121b] p-1 shadow-2xl z-50">
              <button
                onClick={() => handleAction(onToggleSidebar)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>{isSidebarCollapsed ? 'Expand Sidebar Tab' : 'Collapse Sidebar Tab'}</span>
                <span className="text-[10px] text-gray-500 font-mono">⌘B</span>
              </button>

              <div className="h-px bg-[#222230] my-1" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Switch Agent Space
              </div>

              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('chat'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Supru Chat</span>
                {activeWorkspaceView === 'chat' && <Check size={12} className="text-amber-400" />}
              </button>

              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('editor'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Supru Code</span>
                {activeWorkspaceView === 'editor' && <Check size={12} className="text-amber-400" />}
              </button>

              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('terminal'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Supru CLI</span>
                {activeWorkspaceView === 'terminal' && <Check size={12} className="text-amber-400" />}
              </button>

              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('agent'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Supru Hunter (Studio)</span>
                {activeWorkspaceView === 'agent' && <Check size={12} className="text-amber-400" />}
              </button>

              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('github'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Supru Git</span>
                {activeWorkspaceView === 'github' && <Check size={12} className="text-amber-400" />}
              </button>

              <div className="h-px bg-[#222230] my-1" />
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Rearrange Coding Windows
              </div>

              <button
                onClick={() => {
                  onChangeWorkspaceView('editor');
                  handleAction(() => onChangeCodingLayout('single'));
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 size={12} />
                  <span>Single Full Editor</span>
                </div>
                {codingLayout === 'single' && <Check size={12} className="text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                  onChangeWorkspaceView('editor');
                  handleAction(() => onChangeCodingLayout('split-terminal'));
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Columns2 size={12} />
                  <span>Split: Code + Supru CLI</span>
                </div>
                {codingLayout === 'split-terminal' && <Check size={12} className="text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                  onChangeWorkspaceView('editor');
                  handleAction(() => onChangeCodingLayout('split-hunter'));
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Columns2 size={12} />
                  <span>Split: Code + Supru Hunter</span>
                </div>
                {codingLayout === 'split-hunter' && <Check size={12} className="text-emerald-400" />}
              </button>

              <button
                onClick={() => {
                  onChangeWorkspaceView('editor');
                  handleAction(() => onChangeCodingLayout('split-github'));
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <div className="flex items-center gap-2">
                  <Columns2 size={12} />
                  <span>Split: Code + Supru Git</span>
                </div>
                {codingLayout === 'split-github' && <Check size={12} className="text-emerald-400" />}
              </button>
            </div>
          )}
        </div>

        {/* 4. SUPRU TEAM MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('team')}
            className={`flex items-center gap-1 rounded px-2 py-0.5 font-semibold text-amber-300 transition-colors ${
              activeMenu === 'team' ? 'bg-[#222230] text-amber-200' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <span>Supru Team</span>
            <ChevronDown size={11} className="opacity-70" />
          </button>

          {activeMenu === 'team' && (
            <div className="absolute left-0 top-7 w-64 rounded-xl border border-amber-500/30 bg-[#12121b] p-1.5 shadow-2xl z-50">
              <button
                onClick={() => handleAction(onOpenSupruTeam)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 mb-1"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>Meet Supru Team Squad...</span>
                </div>
              </button>

              <div className="space-y-0.5">
                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('agent'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Bot size={14} className="text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">Supru Hunter</div>
                    <div className="text-[10px] text-gray-400">Headless Developing Studio</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('editor'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Code2 size={14} className="text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Supru Code</div>
                    <div className="text-[10px] text-gray-400">Multi-Language Code Studio</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('terminal'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Terminal size={14} className="text-sky-400" />
                  <div>
                    <div className="font-semibold text-white">Supru CLI</div>
                    <div className="text-[10px] text-gray-400">Developer Shell Engine</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('chat'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <MessageSquare size={14} className="text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">Supru Chat</div>
                    <div className="text-[10px] text-gray-400">Generative Feline Intelligence</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('github'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <GitBranch size={14} className="text-purple-400" />
                  <div>
                    <div className="font-semibold text-white">Supru Git</div>
                    <div className="text-[10px] text-gray-400">Repository Intelligence</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction(() => onChangeWorkspaceView('topology'))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Layers size={14} className="text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">The Stratified Stack (v1.3.0)</div>
                    <div className="text-[10px] text-gray-400">Manifold ⊗ Formula • Zero-Friction Glider</div>
                  </div>
                </button>

                <div className="h-px bg-[#222230] my-1" />

                <button
                  onClick={() => handleAction(onOpenImageStudio)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Wand2 size={13} className="text-amber-400" />
                  <span>Supru Vision (Image Studio)</span>
                </button>

                <button
                  onClick={() => handleAction(onOpenVeoStudio)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
                >
                  <Film size={13} className="text-orange-400" />
                  <span>Supru Motion (Veo 3.1)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. TERMINAL MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('terminal')}
            className={`rounded px-2 py-0.5 transition-colors ${
              activeMenu === 'terminal' ? 'bg-[#222230] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            Terminal
          </button>

          {activeMenu === 'terminal' && (
            <div className="absolute left-0 top-7 w-52 rounded-xl border border-[#272738] bg-[#12121b] p-1 shadow-2xl z-50">
              <button
                onClick={() => handleAction(() => onChangeWorkspaceView('terminal'))}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Launch Supru CLI</span>
                <span className="text-[10px] text-gray-500 font-mono">`</span>
              </button>

              <button
                onClick={() => {
                  onChangeWorkspaceView('terminal');
                  handleAction(() => {
                    window.dispatchEvent(new CustomEvent('supru-run-terminal-command', { detail: 'node supru_pipeline.ts' }));
                  });
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Run Active File</span>
                <span className="text-[10px] text-gray-500 font-mono">F5</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. HELP MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            className={`rounded px-2 py-0.5 transition-colors ${
              activeMenu === 'help' ? 'bg-[#222230] text-white' : 'hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            Help
          </button>

          {activeMenu === 'help' && (
            <div className="absolute left-0 top-7 w-56 rounded-xl border border-[#272738] bg-[#12121b] p-1 shadow-2xl z-50">
              <button
                onClick={() => handleAction(onOpenHelp)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>Keyboard Shortcuts & Docs</span>
                <HelpCircle size={13} className="text-gray-400" />
              </button>

              <button
                onClick={() => handleAction(onOpenLocalSettings)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span>AI Engine (Cloud / Local)</span>
                <Server size={13} className="text-emerald-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Quick Layout Rearrange Buttons (Visible when in Code Editor) */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 hidden sm:inline mr-1">Workspace Layout:</span>
        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('editor');
            onChangeCodingLayout('single');
          }}
          title="Single Editor View"
          className={`rounded p-1 transition-colors ${
            activeWorkspaceView === 'editor' && codingLayout === 'single'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Maximize2 size={12} />
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('editor');
            onChangeCodingLayout('split-terminal');
          }}
          title="Split: Supru Code + Supru CLI"
          className={`rounded p-1 transition-colors ${
            activeWorkspaceView === 'editor' && codingLayout === 'split-terminal'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Columns2 size={12} />
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            onChangeWorkspaceView('editor');
            onChangeCodingLayout('split-hunter');
          }}
          title="Split: Supru Code + Supru Hunter"
          className={`rounded p-1 transition-colors ${
            activeWorkspaceView === 'editor' && codingLayout === 'split-hunter'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Bot size={12} />
        </button>
      </div>
    </div>
  );
};
