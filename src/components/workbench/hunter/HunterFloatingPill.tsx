import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Paperclip,
  Send,
  Sliders,
  Terminal,
  Maximize2,
  Minimize2,
  Workflow,
  Cpu,
  Zap,
  Move,
  Check,
  X,
  Bot
} from 'lucide-react';
import { soundFx } from '../../../utils/audio';

interface HunterFloatingPillProps {
  onSendMessage: (content: string) => void;
  onOpenWorkbench?: () => void;
  onSelectMilestone?: (milestone: string) => void;
  isExpandedToWorkbench?: boolean;
}

const SLASH_COMMANDS = [
  { cmd: '/run', desc: 'Execute active milestone pipeline' },
  { cmd: '/plan', desc: 'Decompose goal with Lead & Planner' },
  { cmd: '/roadmap', desc: 'Inspect ROADMAP.md milestones' },
  { cmd: '/agents', desc: 'View 8-agent contract status' },
  { cmd: '/status', desc: 'Query Rust execution authority state' },
  { cmd: '/pause', desc: 'Pause active multi-agent pipeline' },
  { cmd: '/resume', desc: 'Resume workflow from checkpoint' },
  { cmd: '/approve', desc: 'Approve pending human gate action' },
  { cmd: '/reject', desc: 'Reject pending action with reason' },
  { cmd: '/cli', desc: 'Run command in Rust PTY terminal' },
];

export const HunterFloatingPill: React.FC<HunterFloatingPillProps> = ({
  onSendMessage,
  onOpenWorkbench,
  onSelectMilestone,
  isExpandedToWorkbench = false
}) => {
  const [inputVal, setInputVal] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Pro (Oracle)');
  const [selectedProvider, setSelectedProvider] = useState('Rust PTY / Tauri Native');
  const [isAgentWorkflowActive, setIsAgentWorkflowActive] = useState(true);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Position and Size persistence
  const [position, setPosition] = useState({ x: 0, y: 24 });
  const [size, setSize] = useState({ width: 520, height: 68 });
  const [isMinimized, setIsMinimized] = useState(false);

  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0, handle: '' });

  // Center horizontally initially
  useEffect(() => {
    const defaultX = Math.max(20, Math.floor((window.innerWidth - 520) / 2));
    setPosition({ x: defaultX, y: 24 });
  }, []);

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = dragStartRef.current.mouseY - ev.clientY; // bottom-anchored
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - size.width - 10, dragStartRef.current.startX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - size.height - 10, dragStartRef.current.startY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStartResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startW: size.width,
      startH: size.height,
      handle
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeStartRef.current.mouseX;
      const dy = resizeStartRef.current.mouseY - ev.clientY;

      let newW = resizeStartRef.current.startW;
      let newH = resizeStartRef.current.startH;

      if (handle.includes('e')) newW = Math.max(300, Math.min(window.innerWidth * 0.75, resizeStartRef.current.startW + dx));
      if (handle.includes('w')) newW = Math.max(300, Math.min(window.innerWidth * 0.75, resizeStartRef.current.startW - dx));
      if (handle.includes('n')) newH = Math.max(56, Math.min(180, resizeStartRef.current.startH + dy));

      setSize({ width: newW, height: newH });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    soundFx.playClick();
    onSendMessage(inputVal.trim());
    setInputVal('');
    setShowSlashMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && inputVal.length === 0) {
      setShowSlashMenu(true);
    }
  };

  const handleSelectSlash = (cmd: string) => {
    soundFx.playClick();
    setInputVal(cmd + ' ');
    setShowSlashMenu(false);
  };

  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, bottom: `${position.y}px` }}
        className="fixed z-50 flex items-center gap-2 rounded-full border border-[#3c3c3e] bg-[#2b2b2d]/95 px-3 py-1.5 shadow-2xl backdrop-blur-xl transition-all select-none"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c49a6c]/20 text-[#c49a6c]">
          <Bot size={13} />
        </div>
        <span className="text-xs font-bold text-gray-200">Supru Pill</span>
        <button
          onClick={() => { soundFx.playClick(); setIsMinimized(false); }}
          className="rounded p-1 text-gray-400 hover:text-white"
          title="Restore Pill"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        width: `${size.width}px`,
        minHeight: `${size.height}px`
      }}
      className="fixed z-50 flex flex-col rounded-2xl border border-[#3c3c3e] bg-[#2b2b2d]/95 p-2 shadow-2xl backdrop-blur-2xl transition-[border-color,background] select-none hover:border-[#c49a6c]/50 font-sans"
    >
      {/* 8 Resize Handles */}
      <div onMouseDown={(e) => handleStartResize(e, 'n')} className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize" />
      <div onMouseDown={(e) => handleStartResize(e, 'e')} className="absolute top-3 bottom-3 -right-1 w-2 cursor-e-resize" />
      <div onMouseDown={(e) => handleStartResize(e, 'w')} className="absolute top-3 bottom-3 -left-1 w-2 cursor-w-resize" />
      <div onMouseDown={(e) => handleStartResize(e, 'ne')} className="absolute -top-1.5 -right-1.5 h-3 w-3 cursor-ne-resize" />
      <div onMouseDown={(e) => handleStartResize(e, 'nw')} className="absolute -top-1.5 -left-1.5 h-3 w-3 cursor-nw-resize" />

      {/* Pill Header Bar (Draggable) */}
      <div
        onMouseDown={handleMouseDownHeader}
        className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] text-[10px] cursor-grab active:cursor-grabbing text-gray-400"
      >
        <div className="flex items-center gap-2">
          <img
            src="/cat_icon.png"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/src/assets/images/cat_icon.png'; }}
            alt="Supru"
            className="h-4 w-4 rounded-full object-cover border border-[#c49a6c]/60 shadow-sm"
          />
          <span className="font-bold text-gray-200">Supru Interaction Pill</span>
          <span className="text-[#c49a6c] font-mono">Tauri/Rust Auth</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#1a1a1c] text-[10px] text-gray-300 rounded px-1.5 py-0.5 border border-white/[0.08] outline-none cursor-pointer"
          >
            <option value="Gemini 2.5 Pro (Oracle)">Gemini 2.5 Pro (Oracle)</option>
            <option value="Claude 3.7 Sonnet (Builder)">Claude 3.7 Sonnet (Builder)</option>
            <option value="Llama-3-8B Mojo (Expert)">Llama-3-8B Mojo (Local)</option>
            <option value="Z3 Symbolic (Judge)">Z3 Symbolic (Judge)</option>
          </select>

          {/* Workflow Toggle */}
          <button
            onClick={() => { soundFx.playClick(); setIsAgentWorkflowActive(!isAgentWorkflowActive); }}
            className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono font-bold transition-colors ${
              isAgentWorkflowActive
                ? 'bg-[#c49a6c]/20 text-[#c49a6c] border border-[#c49a6c]/40'
                : 'text-gray-500 bg-white/[0.04]'
            }`}
            title="Toggle Multi-Agent Workflow Chain"
          >
            {isAgentWorkflowActive ? 'Agents: ON' : 'Direct'}
          </button>

          {/* Minimize */}
          <button
            onClick={() => { soundFx.playClick(); setIsMinimized(true); }}
            className="rounded p-0.5 text-gray-400 hover:text-white"
            title="Minimize to tiny pill"
          >
            <Minimize2 size={11} />
          </button>
        </div>
      </div>

      {/* Slash Commands Dropdown Menu */}
      {showSlashMenu && (
        <div className="absolute left-2 bottom-full mb-1.5 w-72 rounded-xl border border-[#3c3c3e] bg-[#1a1a1d] p-1.5 shadow-2xl z-50 text-xs">
          <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#c49a6c] font-mono">
            Slash Commands
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {SLASH_COMMANDS.map((item) => (
              <button
                key={item.cmd}
                onClick={() => handleSelectSlash(item.cmd)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs hover:bg-white/[0.08] text-gray-200"
              >
                <span className="font-mono font-bold text-[#c49a6c]">{item.cmd}</span>
                <span className="text-[10px] text-gray-400">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Field Body */}
      <div className="mt-1 flex items-end gap-1.5">
        <textarea
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (e.target.value.startsWith('/')) setShowSlashMenu(true);
            else if (showSlashMenu) setShowSlashMenu(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Supru Hunter or type / for slash commands (e.g. /plan, /roadmap, /run)..."
          rows={1}
          style={{ maxHeight: '88px' }}
          className="flex-1 resize-none rounded-xl border border-[#2d2d33] bg-[#0e0e11] px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#c49a6c] font-sans"
        />

        {/* Action Buttons: Attachments & Meow! Send */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { soundFx.playClick(); setShowSlashMenu(!showSlashMenu); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-[#161618] text-gray-400 hover:text-white hover:bg-white/[0.08]"
            title="Slash commands list"
          >
            <span className="font-mono font-bold text-xs">/</span>
          </button>

          <button
            onClick={handleSend}
            disabled={!inputVal.trim()}
            className="flex h-7 items-center gap-1 rounded-xl bg-[#f2f2f2] px-3 font-bold text-xs text-[#151515] hover:bg-white active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 shadow-md"
            title="Send to Supru Hunter (Enter)"
          >
            <span>Meow!</span>
            <Send size={11} className="fill-[#151515]" />
          </button>
        </div>
      </div>
    </div>
  );
};
