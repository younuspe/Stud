import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Copy, 
  Check, 
  CornerDownLeft, 
  Cpu, 
  RefreshCw,
} from 'lucide-react';
import { TerminalCommandResult, LocalHostConfig } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface TerminalViewProps {
  localConfig: LocalHostConfig;
  onOpenLocalSettings: () => void;
  onOpenEditorWithFile?: (fileName: string, content: string) => void;
  onTriggerAgent?: (objective: string) => void;
}

const PRESET_COMMANDS = [
  'help',
  'git status',
  'ls -la',
  'node -v',
  'cat package.json',
  'provider status',
  'model list'
];

export const TerminalView: React.FC<TerminalViewProps> = ({
  localConfig,
  onOpenLocalSettings,
  onOpenEditorWithFile,
  onTriggerAgent,
}) => {
  const [inputCommand, setInputCommand] = useState('');
  const [history, setHistory] = useState<TerminalCommandResult[]>([]);
  const [commandHistoryList, setCommandHistoryList] = useState<string[]>(['help']);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isExecuting]);

  useEffect(() => {
    const handleRunCmd = (e: any) => {
      if (e.detail) {
        handleExecute(e.detail);
      }
    };
    window.addEventListener('supru-run-terminal-command', handleRunCmd);
    return () => window.removeEventListener('supru-run-terminal-command', handleRunCmd);
  }, []);

  const handleExecute = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun !== undefined ? cmdToRun : inputCommand).trim();
    if (!rawCmd || isExecuting) return;

    soundFx.playClick();
    const cmdId = `cmd-${Date.now()}`;
    const startTime = Date.now();

    setCommandHistoryList((prev) => [rawCmd, ...prev.filter((c) => c !== rawCmd)]);
    setHistoryIndex(-1);
    setInputCommand('');
    setIsExecuting(true);

    const lower = rawCmd.toLowerCase();

    if (lower === 'clear') {
      setHistory([]);
      setIsExecuting(false);
      return;
    }

    if (lower === 'help' || lower === '?') {
      const helpOutput = `🐾 SUPRU CLI COMMAND CATALOG:
==================================================
🤖 AGENT & AI COMMANDS:
  hunter <task>         Launch Supru Hunter Autonomous Developing Studio
  agent <task>          Launch Supru Hunter
  provider status       Show active AI provider (Cloud vs Localhost)
  provider switch       Configure Localhost / Cloud AI Provider
  model list            List installed / supported models

⚡ SHELL & SYSTEM COMMANDS:
  ls [-la]              List directory files and folders
  cat <file>            Print file contents to terminal
  pwd                   Print current working directory
  node -v / npm -v      Check Node.js / NPM version
  git status            View Git status, branch, and staged files
  git log               Show recent commits
  clear                 Clear terminal window history

💡 WORKSPACE SHORTCUTS:
  code <file>           Open file in Supru Code editor
  help                  Show this manual`;

      setHistory((prev) => [
        ...prev,
        {
          id: cmdId,
          command: rawCmd,
          output: helpOutput,
          exitCode: 0,
          timestamp: Date.now(),
          durationMs: 4,
        },
      ]);
      setIsExecuting(false);
      return;
    }

    if (lower.startsWith('agent ') || lower.startsWith('hunter ')) {
      const objective = rawCmd.replace(/^(agent|hunter)\s+/i, '').trim();
      if (onTriggerAgent) {
        onTriggerAgent(objective);
        setHistory((prev) => [
          ...prev,
          {
            id: cmdId,
            command: rawCmd,
            output: `🚀 Triggering Supru Hunter with objective:\n"${objective}"\nRedirecting to Hunter Studio...`,
            exitCode: 0,
            timestamp: Date.now(),
            durationMs: 10,
          },
        ]);
        setIsExecuting(false);
        return;
      }
    }

    if (lower === 'provider switch' || lower === 'provider config') {
      onOpenLocalSettings();
      setHistory((prev) => [
        ...prev,
        {
          id: cmdId,
          command: rawCmd,
          output: `Opening AI Engine & Localhost Manager modal...`,
          exitCode: 0,
          timestamp: Date.now(),
          durationMs: 4,
        },
      ]);
      setIsExecuting(false);
      return;
    }

    if (lower === 'provider status') {
      const statusText = `AI PROVIDER STATUS:
Provider: ${localConfig.provider}
Endpoint: ${localConfig.endpointUrl || 'Default Generative Cloud'}
Model:    ${localConfig.modelName || 'gemini-3.8-flash'}
API Key:  ${localConfig.provider === 'gemini_cloud' ? 'Configured or fallback' : 'Not required (Localhost)'}`;

      setHistory((prev) => [
        ...prev,
        {
          id: cmdId,
          command: rawCmd,
          output: statusText,
          exitCode: 0,
          timestamp: Date.now(),
          durationMs: 4,
        },
      ]);
      setIsExecuting(false);
      return;
    }

    try {
      const res = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: rawCmd }),
      });

      const data = await res.json();

      if (data.clearScreen) {
        setHistory([]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            id: cmdId,
            command: rawCmd,
            output: data.output || '(No output)',
            exitCode: data.exitCode || 0,
            timestamp: Date.now(),
            durationMs: data.durationMs || Date.now() - startTime,
          },
        ]);
      }
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: cmdId,
          command: rawCmd,
          output: `Error executing command: ${err.message}`,
          exitCode: 1,
          timestamp: Date.now(),
          durationMs: Date.now() - startTime,
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryList.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistoryList.length - 1);
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistoryList[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCommand(commandHistoryList[nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCommand('');
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#09090d] text-gray-200 overflow-hidden font-mono text-xs">
      {/* Top Terminal Status Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1c1c28] bg-[#0f0f16] px-3 py-1.5 text-[11px]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f87171] inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24] inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34d399] inline-block" />
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#272738] pl-2.5 text-gray-300">
            <TerminalIcon size={13} className="text-amber-400" />
            <span className="font-semibold text-white">Supru CLI</span>
            <span className="rounded bg-[#1a1a27] px-1.5 py-0.2 text-[9.5px] text-amber-300 border border-amber-500/20">
              bash 5.2
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenLocalSettings}
            className="flex items-center gap-1 rounded-md border border-[#272738] bg-[#161622] px-2 py-0.5 text-[10px] text-gray-300 hover:border-amber-500/40 hover:text-white"
            title="Configure Cloud vs Localhost models"
          >
            <Cpu size={11} className="text-amber-400" />
            <span>{localConfig.provider.replace('_', ' ')}</span>
          </button>

          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-1 rounded-md border border-[#272738] bg-[#161622] px-2 py-0.5 text-[10px] text-gray-400 hover:bg-rose-500/10 hover:text-rose-300"
            title="Clear terminal buffer"
          >
            <Trash2 size={11} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Commands Rail */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#191924] bg-[#0c0c12] px-3 py-1 text-[10.5px]">
        <span className="text-gray-500 shrink-0 font-sans text-[9px] uppercase font-semibold">Quick Run:</span>
        {PRESET_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleExecute(cmd)}
            className="shrink-0 rounded border border-[#232332] bg-[#14141e] px-1.5 py-0.2 text-gray-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div 
        className="flex-1 overflow-y-auto p-3 space-y-3 text-[11px] font-mono leading-relaxed selection:bg-amber-500/30 selection:text-amber-200"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((item) => (
          <div key={item.id} className="group rounded-lg border border-transparent hover:border-[#1e1e2c] p-1.5 transition-all">
            <div className="flex items-center justify-between text-gray-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-emerald-400 font-semibold">supru@shell</span>
                <span className="text-gray-500">:</span>
                <span className="text-sky-400">~/workspace</span>
                <span className="text-amber-400 font-bold">$</span>
                <span className="text-white font-bold">{item.command}</span>
              </div>

              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9.5px] text-gray-500">{item.durationMs}ms</span>
                <span
                  className={`text-[9.5px] font-bold px-1 py-0.1 rounded ${
                    item.exitCode === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  exit {item.exitCode}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(item.output, item.id);
                  }}
                  className="rounded p-0.5 text-gray-400 hover:bg-[#252535] hover:text-white"
                  title="Copy output"
                >
                  {copiedId === item.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <pre className="mt-1 whitespace-pre-wrap text-gray-300 font-mono text-[10.5px] leading-relaxed bg-[#0e0e15]/60 rounded-md p-2 border border-[#181822]">
              {item.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-1.5 text-amber-400 p-1.5 animate-pulse text-[11px]">
            <RefreshCw size={12} className="animate-spin" />
            <span>Supru CLI executing command...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Dock */}
      <div className="border-t border-[#1c1c28] bg-[#0e0e16] p-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-[#262638] bg-[#07070b] px-2.5 py-1.5 focus-within:border-amber-500/70">
          <span className="text-emerald-400 font-semibold select-none text-[11px]">supru-cli$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Type command ('help', 'git status', 'hunter <task>', 'ls -la')..."
            className="flex-1 bg-transparent text-[11.5px] text-white placeholder-gray-500 outline-none font-mono"
            autoFocus
          />
          <button
            onClick={() => handleExecute()}
            disabled={!inputCommand.trim() || isExecuting}
            className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10.5px] font-semibold text-amber-400 hover:bg-amber-500/30 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <span>Run</span>
            <CornerDownLeft size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
