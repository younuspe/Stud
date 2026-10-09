import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Terminal,
  MessageSquare,
  Bot,
  Play,
  Check,
  X,
  FileText,
  Sliders,
  Scale,
  Sparkles,
  ShieldCheck,
  Send,
  Eye,
  GitBranch,
  Zap
} from 'lucide-react';
import { EditorFile, HunterAgentDefinition, HunterEvidence } from '../../../types/workbench';
import { soundFx } from '../../../utils/audio';

interface HunterWorkbenchLayoutProps {
  files: EditorFile[];
  onSelectFile: (file: EditorFile) => void;
  activeFile: EditorFile;
  onUpdateFileContent: (fileId: string, newContent: string) => void;
  onRunTerminalCommand: (command: string) => void;
  terminalLogs: string[];
  agents: HunterAgentDefinition[];
  evidenceList: HunterEvidence[];
  onSendChatMessage: (msg: string) => void;
  onRunFullPipeline?: () => void;
  isPipelineRunning?: boolean;
}

export const HunterWorkbenchLayout: React.FC<HunterWorkbenchLayoutProps> = ({
  files,
  onSelectFile,
  activeFile,
  onUpdateFileContent,
  onRunTerminalCommand,
  terminalLogs,
  agents,
  evidenceList,
  onSendChatMessage,
  onRunFullPipeline,
  isPipelineRunning = false
}) => {
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'terminal' | 'agents'>('chat');
  const [fileSearch, setFileSearch] = useState('');
  const [cliInput, setCliInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isDiffMode, setIsDiffMode] = useState(false);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const handleExecuteCli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    soundFx.playClick();
    onRunTerminalCommand(cliInput.trim());
    setCliInput('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundFx.playClick();
    onSendChatMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex h-full w-full overflow-hidden border border-[#2a2a2c] bg-[#0a0a0c] font-sans text-xs">
      {/* ======================================================== */}
      {/* COLUMN 1: FILE EXPLORER (LEFT)                           */}
      {/* ======================================================== */}
      <div className="flex w-56 flex-col border-r border-[#2a2a2c] bg-[#161618] shrink-0 select-none">
        {/* Explorer Title & Actions */}
        <div className="flex items-center justify-between border-b border-[#2a2a2c] p-2.5 text-[10.5px] font-bold text-gray-300">
          <div className="flex items-center gap-1.5 uppercase tracking-wider text-[#c49a6c]">
            <Folder size={13} />
            <span>Explorer</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono text-emerald-400">
              Rust Watcher
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#2a2a2c]">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#2d2d33] bg-[#0e0e11] px-2 py-1">
            <Search size={11} className="text-gray-500" />
            <input
              type="text"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-transparent text-[11px] text-white outline-none placeholder-gray-600"
            />
          </div>
        </div>

        {/* File Tree List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          <div className="px-2 py-1 text-[9.5px] font-mono uppercase text-gray-500 font-bold">
            Project Root (Rust Sandboxed)
          </div>
          {filteredFiles.map((file) => {
            const isSelected = file.id === activeFile.id;
            return (
              <button
                key={file.id}
                onClick={() => { soundFx.playClick(); onSelectFile(file); }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#2b2b2d] text-white font-semibold border border-[#3c3c3e]'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
              >
                <FileCode size={13} className={isSelected ? 'text-[#c49a6c]' : 'text-gray-500'} />
                <span className="truncate font-mono">{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Explorer Bottom Meta */}
        <div className="border-t border-[#2a2a2c] p-2 text-[10px] text-gray-500 flex items-center justify-between">
          <span>{files.length} files tracked</span>
          <span className="text-[#c49a6c] font-mono">Tauri PTY ready</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 2: CODE EDITOR (CENTER)                           */}
      {/* ======================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-[#2a2a2c] bg-[#0e0e11]">
        {/* Editor Tabs */}
        <div className="flex items-center justify-between border-b border-[#2a2a2c] bg-[#161618] px-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {files.map((file) => {
              const isActive = file.id === activeFile.id;
              return (
                <button
                  key={file.id}
                  onClick={() => { soundFx.playClick(); onSelectFile(file); }}
                  className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-mono transition-colors ${
                    isActive
                      ? 'border-[#c49a6c] bg-[#0e0e11] text-white font-bold'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <FileCode size={12} className={isActive ? 'text-[#c49a6c]' : 'text-gray-500'} />
                  <span>{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* Diff View Toggle */}
          <div className="flex items-center gap-1.5 py-1">
            <button
              onClick={() => { soundFx.playClick(); setIsDiffMode(!isDiffMode); }}
              className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                isDiffMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-gray-400 hover:text-white bg-white/[0.05]'
              }`}
            >
              {isDiffMode ? 'Diff: ACTIVE' : 'Diff View'}
            </button>
          </div>
        </div>

        {/* Editor Content Area */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-gray-200 bg-[#050505]">
          {isDiffMode ? (
            <div className="space-y-1">
              <div className="rounded bg-rose-500/10 p-2 text-rose-300 border border-rose-500/30">
                - // Previous unverified LLM output (Discarded by Absolute Judge)
              </div>
              <div className="rounded bg-emerald-500/10 p-2 text-emerald-300 border border-emerald-500/30">
                + // Rust-authoritative verification passed (Exit code: 0)
              </div>
              <textarea
                value={activeFile.content}
                onChange={(e) => onUpdateFileContent(activeFile.id, e.target.value)}
                className="w-full h-80 bg-transparent text-gray-200 outline-none resize-none font-mono text-xs leading-relaxed"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              {/* Line Numbers */}
              <div className="text-gray-600 select-none text-right font-mono text-[11px] leading-5 pr-2 border-r border-white/[0.06]">
                {activeFile.content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Editable Code */}
              <textarea
                value={activeFile.content}
                onChange={(e) => onUpdateFileContent(activeFile.id, e.target.value)}
                className="flex-1 bg-transparent text-gray-200 outline-none resize-none font-mono text-xs leading-5"
                rows={Math.max(16, activeFile.content.split('\n').length)}
              />
            </div>
          )}
        </div>

        {/* Editor Status Bar */}
        <div className="flex h-6 items-center justify-between border-t border-[#2a2a2c] bg-[#161618] px-3 text-[10px] text-gray-500 font-mono select-none">
          <span>{activeFile.name} • UTF-8</span>
          <span>{activeFile.language.toUpperCase()}</span>
          <span>Rust Authority: Sandboxed</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* COLUMN 3: RIGHT PANEL (CHAT / CLI / AGENTS)              */}
      {/* ======================================================== */}
      <div className="flex w-80 flex-col bg-[#161618] shrink-0 select-none">
        {/* Subtab Switcher */}
        <div className="flex items-center border-b border-[#2a2a2c] bg-[#121214] p-1 text-xs">
          <button
            onClick={() => { soundFx.playClick(); setRightPanelTab('chat'); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 font-semibold transition-colors ${
              rightPanelTab === 'chat'
                ? 'bg-[#2b2b2d] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={12} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setRightPanelTab('terminal'); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 font-semibold transition-colors ${
              rightPanelTab === 'terminal'
                ? 'bg-[#2b2b2d] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Terminal size={12} />
            <span>CLI / PTY</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setRightPanelTab('agents'); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 font-semibold transition-colors ${
              rightPanelTab === 'agents'
                ? 'bg-[#2b2b2d] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bot size={12} />
            <span>Agents</span>
          </button>
        </div>

        {/* Subtab 1: AI Chat */}
        {rightPanelTab === 'chat' && (
          <div className="flex flex-1 flex-col overflow-hidden p-2.5">
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="rounded-xl bg-[#0e0e11] p-2.5 border border-[#2a2a2c]">
                <div className="text-[10px] font-bold text-[#c49a6c] font-mono flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Supru Hunter Intelligence</span>
                </div>
                <p className="mt-1 text-gray-300 text-[11px]">
                  Desktop AI engineering platform with Rust-enforced authority. Prompts are not security boundaries. Rust is.
                </p>
              </div>

              {/* Sample evidence-backed statement */}
              <div className="rounded-xl bg-[#050505] p-2.5 border border-emerald-500/20 font-mono text-[10.5px] text-emerald-400">
                ✔ cargo check: OK (exit code 0)<br />
                ✔ Policy priority: deny &gt; ask &gt; allow verified.
              </div>
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex items-center gap-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask or type /command..."
                className="flex-1 rounded-xl border border-[#2d2d33] bg-[#0e0e11] px-2.5 py-1.5 text-xs text-white outline-none placeholder-gray-500 font-sans"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#c49a6c] p-2 text-neutral-950 hover:bg-[#b0885c]"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        )}

        {/* Subtab 2: Real Terminal / PTY with Green Text */}
        {rightPanelTab === 'terminal' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#050505] p-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-1 text-[10px] text-gray-400">
              <div className="flex items-center gap-1 text-[#4af626]">
                <Terminal size={12} />
                <span>Rust PTY (portable-pty)</span>
              </div>
              <span>Exit Code: 0</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1 text-[11px] text-[#4af626] leading-relaxed space-y-1">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>

            <form onSubmit={handleExecuteCli} className="mt-1 flex items-center gap-1 border-t border-white/[0.08] pt-1">
              <span className="text-[#4af626] font-bold">$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="cargo test, npm run lint..."
                className="flex-1 bg-transparent text-[#4af626] text-xs outline-none"
              />
            </form>
          </div>
        )}

        {/* Subtab 3: Agents Pipeline & Status */}
        {rightPanelTab === 'agents' && (
          <div className="flex flex-1 flex-col overflow-y-auto p-2 space-y-2 text-xs">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#c49a6c]">
                8-Agent Orchestration Chain
              </span>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/30">
                Zero-Interaction
              </span>
            </div>

            {/* Run 8-Agent End-to-End Workflow Button */}
            {onRunFullPipeline && (
              <button
                onClick={() => {
                  soundFx.playChime();
                  onRunFullPipeline();
                }}
                disabled={isPipelineRunning}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-3 py-2 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
                title="Execute all 8 agents end-to-end with zero human touch"
              >
                {isPipelineRunning ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-neutral-950" />
                    <span>Executing End-to-End Chain...</span>
                  </>
                ) : (
                  <>
                    <Zap size={12} className="fill-neutral-950" />
                    <span>▶ Run 8-Agent Workflow (Zero-Touch)</span>
                  </>
                )}
              </button>
            )}

            {agents.map((ag) => (
              <div
                key={ag.id}
                className="rounded-xl border border-[#2a2a2c] bg-[#0e0e11] p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200 capitalize font-mono">{ag.role}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase ${
                      ag.status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : ag.status === 'working'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : ag.status === 'waiting_approval'
                        ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/30'
                        : 'bg-white/[0.05] text-gray-400'
                    }`}
                  >
                    {ag.status}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono">Model: {ag.model}</div>
                <div className="text-[10.5px] text-gray-300">{ag.duties[0]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
