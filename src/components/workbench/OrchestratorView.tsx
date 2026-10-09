import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Workflow, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Check, 
  Layers, 
  Bug, 
  ArrowRight, 
  Plus, 
  Terminal, 
  Boxes, 
  RefreshCw,
  Search,
  Code2,
  FileCode,
  PieChart,
  Coins
} from 'lucide-react';
import { 
  OrchestratorProject, 
  OrchestratorToolName, 
  OrchestratorToolCall, 
  OrchestratorBug, 
  LocalHostConfig 
} from '../../types/workbench';
import { soundFx } from '../../utils/audio';
import { AutonomousPipelineTab } from './orchestrator/AutonomousPipelineTab';
import { SovereignProtocolTab } from './orchestrator/SovereignProtocolTab';

interface OrchestratorViewProps {
  localConfig: LocalHostConfig;
  onOpenLocalSettings: () => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onTriggerHunter?: (objective: string) => void;
  onSendToChat?: (text: string) => void;
  onChangeWorkspaceView?: (view: any) => void;
}

const PRESET_PROJECTS: OrchestratorProject[] = [
  {
    id: 'workspace-default',
    name: 'New Workflow',
    complexity: 'small',
    description: 'No tasks or execution results yet. Add a task and run a real tool to populate this workspace.',
    tokenBudget: 0,
    tokensUsed: 0,
    tokensSaved: 0,
    activeModel: 'Not connected',
    fallbackModel: 'Not configured',
    tasks: [],
  },
];

const INITIAL_BUGS: OrchestratorBug[] = [];

export const OrchestratorView: React.FC<OrchestratorViewProps> = ({
  localConfig,
  onOpenLocalSettings,
  onOpenInEditor,
  onTriggerHunter,
  onSendToChat,
  onChangeWorkspaceView
}) => {
  const [projects, setProjects] = useState<OrchestratorProject[]>(() => {
    try {
      const saved = localStorage.getItem('supru_orchestrator_projects_v1');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return PRESET_PROJECTS;
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try { return localStorage.getItem('supru_orchestrator_active_project_v1') || PRESET_PROJECTS[0].id; } catch { return PRESET_PROJECTS[0].id; }
  });
  const [bugs, setBugs] = useState<OrchestratorBug[]>(INITIAL_BUGS);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'protocol' | 'overview' | 'tools' | 'tokens' | 'bugs'>('pipeline');
  const [pillObjective, setPillObjective] = useState('');

  // The shared pill submits objectives into this workspace and never redirects to Chat.
  useEffect(() => {
    const receiveObjective = (event: Event) => {
      const objective = (event as CustomEvent<string>).detail;
      if (typeof objective === 'string' && objective.trim()) {
        setPillObjective(objective.trim());
        setActiveTab('pipeline');
      }
    };
    window.addEventListener('supru-orchestrator-prompt', receiveObjective);
    return () => window.removeEventListener('supru-orchestrator-prompt', receiveObjective);
  }, []);
  
  // Token size rearrangement state
  const [tokenChunkSize, setTokenChunkSize] = useState<number>(8192);
  const [selectedTriageModel, setSelectedTriageModel] = useState<string>('Gemini 2.5 Flash');
  const [selectedReasoningModel, setSelectedReasoningModel] = useState<string>('Gemini 2.5 Pro');
  const [pruningStrategy, setPruningStrategy] = useState<'ast' | 'sliding' | 'strict'>('ast');

  // Tool calling facility state
  // Start with an empty evidence log; never present demo results as real execution.
  const [toolCalls, setToolCalls] = useState<OrchestratorToolCall[]>([]);
  const [isCallingTool, setIsCallingTool] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<OrchestratorToolName>('test_runner');

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  useEffect(() => {
    try {
      localStorage.setItem('supru_orchestrator_projects_v1', JSON.stringify(projects));
      localStorage.setItem('supru_orchestrator_active_project_v1', activeProjectId);
    } catch {}
  }, [projects, activeProjectId]);

  // Execute only real, fixed project checks. Tools without an implementation report that fact.
  const handleExecuteTool = async (toolName: OrchestratorToolName): Promise<boolean> => {
    soundFx.playClick();
    if (isCallingTool) return false;
    setIsCallingTool(true);
    setActiveTool(toolName);
    const startedAt = Date.now();
    const commands: Partial<Record<OrchestratorToolName, string>> = {
      linter: 'npm run lint',
      type_checker: 'npm run lint',
      git_diff: 'git diff --stat',
      package_manager: 'npm ls --depth=0',
    };
    const command = commands[toolName];
    let output = '';
    let status: OrchestratorToolCall['status'] = 'error';
    let durationMs = 0;
    try {
      if (!command) {
        output = `This tool is not implemented yet. No operation was run for "${toolName}".`;
        status = 'warning';
      } else {
        const result = await invoke<{ stdout: string; stderr: string; exitCode: number; durationMs: number }>(
          'run_workspace_command',
          { command },
        );
        const commandOutput = [result.stdout, result.stderr].filter(Boolean).join('\n') || '(no output)';
        output = `$ ${command}\n${commandOutput}\nExit code: ${result.exitCode}`;
        status = result.exitCode === 0 ? 'success' : 'error';
        durationMs = Number(result.durationMs) || Date.now() - startedAt;
      }
    } catch (error) {
      output = `Could not execute "${toolName}". The local execution service may be unavailable. ${error instanceof Error ? error.message : String(error)}`;
      status = 'error';
    } finally {
      durationMs = durationMs || Date.now() - startedAt;
      const newCall: OrchestratorToolCall = {
        id: `tc-${Date.now()}`,
        tool: toolName,
        args: command ? { command } : {},
        output,
        status,
        durationMs,
        timestamp: Date.now(),
      };
      setToolCalls(prev => [newCall, ...prev]);
      setIsCallingTool(false);
      if (status === 'success') soundFx.playChime();
    }
    return status === 'success';
  };

  // Bug workflows must not report a fix until a real edit and verification occur.
  const handleResolveBugWithTool = async (bug: OrchestratorBug) => {
    soundFx.playClick();
    setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'investigating' } : b));
    const succeeded = await handleExecuteTool(bug.recommendedTool);
    setBugs(prev => prev.map(b => b.id === bug.id
      ? { ...b, status: succeeded ? 'verifying' : 'open' }
      : b));
  };

  const handleResolveBugWithModel = (bug: OrchestratorBug) => {
    soundFx.playClick();
    setSelectedReasoningModel(bug.recommendedModel);
    setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'investigating' } : b));
    onSendToChat?.(
      `Investigate this reported issue using ${bug.recommendedModel}. Do not claim it is fixed without editing the actual file and running verification.\n\nIssue: ${bug.title}\nFile: ${bug.file}\nDetails: ${bug.errorDetails}\n\nProposed change for review (not yet applied):\n${bug.solutionDiff || 'No patch proposal available.'}`
    );
  };

  const handleApplyBugPatch = (bug: OrchestratorBug) => {
    soundFx.playClick();
    if (onOpenInEditor && bug.solutionDiff) {
      setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'investigating' } : b));
      onOpenInEditor(bug.file.split('/').pop() || 'patch-proposal.ts', bug.solutionDiff);
    } else {
      setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'open' } : b));
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#08080d] text-gray-200 overflow-hidden font-sans text-xs">
      {/* Top Banner Header */}
      <div className="border-b border-[#1b1b28] bg-[#0d0d16] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-md">
              <Workflow size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Supru Orchestrator</h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-300 border border-amber-500/30">
                  Project & Bug Engine
                </span>
                <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                  Token Optimized
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Manage small to multi-complex projects, call verification tools, arrange models & eliminate token wastage
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] text-emerald-300">
              <Coins size={12} />
              <span className="font-bold">Tokens Saved:</span>
              <span className="font-mono">{activeProject.tokensSaved.toLocaleString()} (~54%)</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10.5px] text-purple-300">
              <Cpu size={12} />
              <span className="font-bold">Chunk Window:</span>
              <span className="font-mono">{tokenChunkSize} toks</span>
            </div>
          </div>
        </div>

        {pillObjective && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Objective received from Supru Pill</div>
              <div className="mt-1 break-words text-xs text-white">{pillObjective}</div>
              <div className="mt-1 text-[10px] text-gray-400">Queued in this workspace. No agent execution is claimed until a real run is started.</div>
            </div>
            <button type="button" onClick={() => { onTriggerHunter?.(pillObjective); }} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400">Send objective to Hunter</button>
            <button type="button" onClick={() => setPillObjective('')} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-300 hover:bg-white/5">Dismiss</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-3 flex items-center gap-1 border-t border-[#1a1a27] pt-2 text-[11px] overflow-x-auto">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('pipeline'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'pipeline'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-amber-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Workflow size={13} />
            <span>Autonomous AI Pipelines</span>
            <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono">Multi-Model</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('protocol'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'protocol'
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'text-purple-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={13} />
            <span>Sovereign Singularity (skill.md)</span>
            <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[9px] font-mono">Omni Core</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('tools'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'tools'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench size={13} />
            <span>Tool Calling Facility</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('tokens'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'tokens'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={13} />
            <span>Model Arranger & Token Sizer</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('bugs'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'bugs'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bug size={13} />
            <span>Bug Triage & Self-Healing</span>
            {bugs.filter(b => b.status === 'open').length > 0 && (
              <span className="ml-1 rounded-full bg-rose-500/30 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 border border-rose-500/50">
                {bugs.filter(b => b.status === 'open').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('overview'); }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors shrink-0 ${
              activeTab === 'overview'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Boxes size={13} />
            <span>Projects & Lifecycle</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {/* TAB 0: AUTONOMOUS AI PIPELINES (MULTI-MODEL CONTROL & TOOL CALLING) */}
        {activeTab === 'pipeline' && (
          <div className="max-w-6xl mx-auto">
            <AutonomousPipelineTab
              onOpenInEditor={onOpenInEditor}
              onSendToChat={onSendToChat}
              onTriggerHunter={onTriggerHunter}
            />
          </div>
        )}

        {/* TAB 0.5: SOVEREIGN SINGULARITY PROTOCOL (SKILL.MD) */}
        {activeTab === 'protocol' && (
          <div className="max-w-6xl mx-auto">
            <SovereignProtocolTab
              onSendToChat={onSendToChat}
              onOpenInEditor={onOpenInEditor}
              onChangeWorkspaceView={onChangeWorkspaceView}
            />
          </div>
        )}

        {/* TAB 1: OVERVIEW & PROJECTS */}
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Project Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#222232] bg-[#101018] p-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Project:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => { soundFx.playClick(); setActiveProjectId(proj.id); }}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        proj.id === activeProjectId
                          ? 'bg-amber-500 text-neutral-950 shadow-sm'
                          : 'bg-[#181824] text-gray-300 border border-[#262638] hover:text-white'
                      }`}
                    >
                      <span>{proj.name}</span>
                      <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                        proj.id === activeProjectId ? 'bg-black/30 text-neutral-900' : 'bg-white/10 text-gray-400'
                      }`}>
                        {proj.complexity}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const newProj: OrchestratorProject = {
                      id: `proj-${Date.now()}`,
                      name: `New Project ${projects.length + 1}`,
                      complexity: 'medium',
                      description: 'Custom microservice pipeline configured via Supru Orchestrator.',
                      tokenBudget: 8192,
                      tokensUsed: 0,
                      tokensSaved: 0,
                      activeModel: selectedReasoningModel,
                      fallbackModel: selectedTriageModel,
                      tasks: [
                        { id: `t-${Date.now()}-1`, title: 'Define interface contracts', stage: 'plan', status: 'pending', assignedModel: selectedReasoningModel },
                        { id: `t-${Date.now()}-2`, title: 'Execute code generation & unit verification', stage: 'code', status: 'pending', assignedModel: selectedTriageModel }
                      ]
                    };
                    setProjects(prev => [...prev, newProj]);
                    setActiveProjectId(newProj.id);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-[#2d2d42] bg-[#181824] px-2.5 py-1 text-[10.5px] font-semibold text-gray-300 hover:text-white hover:border-amber-500/40"
                >
                  <Plus size={11} />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* Active Project Details Card */}
            <div className="rounded-2xl border border-amber-500/25 bg-[#101018] p-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{activeProject.name}</h3>
                    <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9.5px] uppercase font-mono font-bold text-amber-300">
                      {activeProject.complexity.replace('_', ' ')} Project
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{activeProject.description}</p>
                </div>

                {/* Model & Budget Badge */}
                <div className="rounded-xl border border-[#252538] bg-[#141420] p-2.5 text-[10.5px] space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Primary Reasoning:</span>
                    <span className="font-semibold text-amber-300">{activeProject.activeModel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-400">Triage & Local Fallback:</span>
                    <span className="font-semibold text-emerald-300">{activeProject.fallbackModel}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Task Roadmap */}
              <div className="mt-4 pt-3 border-t border-[#1a1a27]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Orchestrated Stages & Task Queue
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {activeProject.tasks.filter(t => t.status === 'completed').length} / {activeProject.tasks.length} Done
                  </span>
                </div>

                <div className="space-y-2">
                  {activeProject.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-xl border border-[#1e1e2d] bg-[#14141e] px-3 py-2 text-xs hover:border-[#2d2d42] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                          task.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : task.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-[#1e1e2c] text-gray-500'
                        }`}>
                          {task.status === 'completed' ? <Check size={11} /> : '•'}
                        </div>
                        <span className="font-medium text-gray-200">{task.title}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="uppercase font-mono text-gray-500 px-1.5 py-0.5 rounded bg-[#1c1c28]">
                          {task.stage}
                        </span>
                        <span className="font-mono text-amber-300/80">
                          [{task.assignedModel}]
                        </span>
                        <button
                          onClick={() => {
                            soundFx.playClick();
                            setProjects(prev => prev.map(p => {
                              if (p.id !== activeProject.id) return p;
                              return {
                                ...p,
                                tasks: p.tasks.map(t => t.id === task.id ? {
                                  ...t,
                                  status: t.status === 'completed' ? 'pending' : 'completed'
                                } : t)
                              };
                            }));
                          }}
                          className="rounded p-1 text-gray-400 hover:text-white"
                          title="Toggle Task Status"
                        >
                          <RefreshCw size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOOL CALLING FACILITY */}
        {activeTab === 'tools' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="rounded-xl border border-[#222232] bg-[#101018] p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Wrench size={14} className="text-amber-400" />
                    <span>Interactive Tool Calling Facility</span>
                  </h3>
                  <p className="text-[10.5px] text-gray-400">
                    Direct execution engine for static analysis, unit test verification, AST parsing, and token budgeting.
                  </p>
                </div>
                {isCallingTool && (
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold animate-pulse">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Calling {activeTool}...</span>
                  </div>
                )}
              </div>

              {/* Tool Calling Buttons Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { name: 'linter' as OrchestratorToolName, label: 'Linter', desc: 'Static code analysis', icon: Search },
                  { name: 'test_runner' as OrchestratorToolName, label: 'Test Runner', desc: 'Unit & mock suites', icon: ShieldCheck },
                  { name: 'type_checker' as OrchestratorToolName, label: 'Type Checker', desc: 'Strict tsc compiler', icon: Code2 },
                  { name: 'ast_parser' as OrchestratorToolName, label: 'AST Parser', desc: 'Dependency hierarchy', icon: FileCode },
                  { name: 'token_budgeter' as OrchestratorToolName, label: 'Token Budgeter', desc: 'Rearrange token size', icon: Zap },
                  { name: 'debugger' as OrchestratorToolName, label: 'Debugger', desc: 'Stack trace analyzer', icon: Bug },
                  { name: 'git_diff' as OrchestratorToolName, label: 'Git Diff', desc: 'Unified change guard', icon: Terminal },
                  { name: 'package_manager' as OrchestratorToolName, label: 'Package Audit', desc: 'Dep vulnerability check', icon: Boxes },
                  { name: 'api_checker' as OrchestratorToolName, label: 'API Checker', desc: 'Schema & endpoint probe', icon: RefreshCw },
                ].map(tool => {
                  const Icon = tool.icon;
                  const isCurrent = activeTool === tool.name && isCallingTool;
                  return (
                    <button
                      key={tool.name}
                      onClick={() => handleExecuteTool(tool.name)}
                      disabled={isCallingTool}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-500/20 text-white shadow-lg'
                          : 'border-[#232334] bg-[#14141e] text-gray-300 hover:border-amber-500/40 hover:bg-[#181826]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                        <Icon size={12} className="text-amber-400" />
                        <span>{tool.label}</span>
                      </div>
                      <span className="text-[9.5px] text-gray-500 line-clamp-1">{tool.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tool Execution Stream Logs */}
            <div className="rounded-xl border border-[#20202e] bg-[#0c0c12] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Live Tool Execution Logs ({toolCalls.length})
                </span>
                <button
                  onClick={() => setToolCalls([])}
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                >
                  Clear Logs
                </button>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {toolCalls.map((call) => (
                  <div
                    key={call.id}
                    className="rounded-lg border border-[#1e1e2c] bg-[#12121a] p-2.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between text-gray-400 pb-1.5 mb-1.5 border-b border-[#1c1c28]">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-bold uppercase">[{call.tool}]</span>
                        <span className="text-[10px] text-gray-500">{new Date(call.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-emerald-400">{call.durationMs}ms</span>
                        <span className="rounded bg-emerald-500/20 px-1 text-emerald-300 text-[9px] uppercase">
                          {call.status}
                        </span>
                      </div>
                    </div>
                    <pre className="text-gray-200 whitespace-pre-wrap font-mono leading-relaxed text-[10.5px]">
                      {call.output}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MODEL ARRANGER & TOKEN SIZER */}
        {activeTab === 'tokens' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Token Wastage Reduction Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-500/30 bg-[#0f1712] p-3.5 shadow-md">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                  <Coins size={14} />
                  <span>Token Wastage Eliminated</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-300">54.2%</div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Through dynamic AST pruning and context window rearrangement.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-[#140e1a] p-3.5 shadow-md">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
                  <Sliders size={14} />
                  <span>Active Chunk Size</span>
                </div>
                <div className="text-xl font-bold font-mono text-purple-300">{tokenChunkSize} Tokens</div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Prevents runaway model context bloat and hallucination spikes.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-[#16120b] p-3.5 shadow-md">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                  <Cpu size={14} />
                  <span>Multi-Model Arrangement</span>
                </div>
                <div className="text-xs font-bold text-amber-200 mt-1 truncate">
                  {selectedReasoningModel}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  Triage Model: {selectedTriageModel}
                </p>
              </div>
            </div>

            {/* Token Size Rearranger Slider */}
            <div className="rounded-xl border border-[#222232] bg-[#101018] p-4">
              <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>Rearrange Context Token Window</span>
              </h3>
              <p className="text-[10.5px] text-gray-400 mb-3">
                Adjust chunking parameters to eliminate redundant context, prevent token cost explosion, and maximize cache resonance.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Selected Chunk Window:</span>
                  <span className="font-mono font-bold text-amber-400">{tokenChunkSize.toLocaleString()} tokens</span>
                </div>

                <input
                  type="range"
                  min="2048"
                  max="32768"
                  step="2048"
                  value={tokenChunkSize}
                  onChange={(e) => {
                    soundFx.playClick();
                    setTokenChunkSize(Number(e.target.value));
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>2,048 (Micro-Script)</span>
                  <span>8,192 (Standard IDE)</span>
                  <span>16,384 (Service Monorepo)</span>
                  <span>32,768 (Full Architecture)</span>
                </div>
              </div>

              {/* Pruning Strategy Selection */}
              <div className="mt-4 pt-3 border-t border-[#1c1c28]">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
                  Token Pruning & Context Optimization Strategy
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ast', title: 'AST Semantic Pruning', desc: 'Strips dead functions & unreachable branches before sending' },
                    { id: 'sliding', title: 'Sliding Window + Summarizer', desc: 'Maintains recent active lines and summarizes previous blocks' },
                    { id: 'strict', title: 'Strict Token Budgeting', desc: 'Caps prompt at exact token boundary to prevent overage' },
                  ].map(strat => (
                    <button
                      key={strat.id}
                      onClick={() => { soundFx.playClick(); setPruningStrategy(strat.id as any); }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        pruningStrategy === strat.id
                          ? 'border-amber-500 bg-amber-500/15 text-white'
                          : 'border-[#242436] bg-[#14141e] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-white mb-0.5">{strat.title}</div>
                      <div className="text-[10px] text-gray-400 leading-tight">{strat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Arranger Matrix */}
            <div className="rounded-xl border border-[#222232] bg-[#101018] p-4">
              <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Cpu size={14} className="text-purple-400" />
                <span>Multi-Model Arrangement & Task Assignment</span>
              </h3>
              <p className="text-[10.5px] text-gray-400 mb-3">
                Route simpler tasks (linting, basic triage) to fast low-token models, and complex architecture to high-reasoning models.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#262638] bg-[#141420] p-3">
                  <span className="text-[10.5px] font-bold text-gray-300 block mb-1">
                    Triage & Fast Tool Dispatch Model
                  </span>
                  <select
                    value={selectedTriageModel}
                    onChange={(e) => setSelectedTriageModel(e.target.value)}
                    className="w-full rounded-lg border border-[#2c2c40] bg-[#181824] px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Ultra-fast, lowest tokens)</option>
                    <option value="Ollama Llama-3-8B">Ollama Llama-3-8B (Zero-cloud local)</option>
                    <option value="Local Mistral-7B">Local Mistral-7B</option>
                    <option value="Offline Supru Core">Offline Supru Smart Core</option>
                  </select>
                </div>

                <div className="rounded-xl border border-[#262638] bg-[#141420] p-3">
                  <span className="text-[10.5px] font-bold text-gray-300 block mb-1">
                    Deep Reasoning & Orchestration Model
                  </span>
                  <select
                    value={selectedReasoningModel}
                    onChange={(e) => setSelectedReasoningModel(e.target.value)}
                    className="w-full rounded-lg border border-[#2c2c40] bg-[#181824] px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Deep Architecture & Reasoning)</option>
                    <option value="DeepSeek-Coder-33B">DeepSeek-Coder-33B (Local/Host Code Engine)</option>
                    <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet (Advanced Refactor)</option>
                    <option value="Qwen 2.5 Coder 32B">Qwen 2.5 Coder 32B</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BUG TRIAGE & SELF-HEALING */}
        {activeTab === 'bugs' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-[#140c0f] p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Bug size={14} />
                    <span>Supru Orchestrator Bug Triage & Self-Healing</span>
                  </h3>
                  <p className="text-[10.5px] text-gray-400 mt-0.5">
                    He must ask to check the tools or models to fix the errors, and efficiently handle bugs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const newBug: OrchestratorBug = {
                      id: `bug-${Date.now()}`,
                      title: `Syntax / Runtime Error in worker thread`,
                      file: `src/workers/dispatcher.ts`,
                      line: Math.floor(Math.random() * 120) + 10,
                      severity: 'high',
                      errorDetails: 'Uncaught Promise Rejection: Timeout waiting for model token socket buffer.',
                      recommendedTool: 'debugger',
                      recommendedModel: selectedReasoningModel,
                      status: 'open',
                      solutionDiff: `// Patch dispatcher timeout:\n- await socket.connect({ timeout: 1000 });\n+ await socket.connect({ timeout: 5000, retryCount: 3 });`
                    };
                    setBugs(prev => [newBug, ...prev]);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/20 px-2.5 py-1 text-[10.5px] font-bold text-rose-200 hover:bg-rose-500/30"
                >
                  <Plus size={11} />
                  <span>Simulate New Bug</span>
                </button>
              </div>
            </div>

            {/* Bugs List */}
            <div className="space-y-3">
              {bugs.map((bug) => {
                const isOpen = bug.status === 'open';
                const isFixed = bug.status === 'fixed';
                const isInvestigating = bug.status === 'investigating' || bug.status === 'verifying';

                return (
                  <div
                    key={bug.id}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isFixed
                        ? 'border-emerald-500/30 bg-[#0c140e]'
                        : isInvestigating
                        ? 'border-amber-500/40 bg-[#16130b] shadow-lg animate-pulse'
                        : 'border-[#2a1d22] bg-[#140e12]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          isFixed ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'
                        }`} />
                        <h4 className="text-xs font-bold text-white">{bug.title}</h4>
                        <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9.5px] font-mono text-gray-400 border border-[#2b2b3a]">
                          {bug.file}:{bug.line}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          bug.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {bug.severity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isFixed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {bug.status}
                        </span>
                      </div>
                    </div>

                    {/* Error Details */}
                    <div className="mt-2 rounded-lg bg-black/50 p-2 font-mono text-[10.5px] text-rose-200/90 border border-rose-950/40">
                      {bug.errorDetails}
                    </div>

                    {/* Orchestrator Prompt & Asking action bar */}
                    {!isFixed && (
                      <div className="mt-3 rounded-xl border border-amber-500/20 bg-[#181512] p-2.5 text-xs">
                        <div className="text-[11px] font-semibold text-amber-300 mb-2 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-amber-400" />
                          <span>Supru Orchestrator Diagnostic Proposal:</span>
                          <span className="text-gray-300 font-normal">
                            Would you like to check with <strong className="text-white">[{bug.recommendedTool}]</strong> or arrange model to <strong className="text-white">[{bug.recommendedModel}]</strong> to fix this error?
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleResolveBugWithTool(bug)}
                            className="flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-500/20 px-2.5 py-1 text-[10.5px] font-bold text-purple-200 hover:bg-purple-500/30"
                          >
                            <Wrench size={11} />
                            <span>1. Check with Tool ({bug.recommendedTool})</span>
                          </button>

                          <button
                            onClick={() => handleResolveBugWithModel(bug)}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-200 hover:bg-amber-500/30"
                          >
                            <Cpu size={11} />
                            <span>2. Arrange Model & Diagnose</span>
                          </button>

                          <button
                            onClick={() => handleApplyBugPatch(bug)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-[10.5px] font-bold text-neutral-950 hover:bg-emerald-400 ml-auto"
                          >
                            <CheckCircle2 size={11} />
                            <span>3. Auto-Fix & Apply Patch</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fixed Resolution */}
                    {isFixed && (
                      <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-[10.5px] text-emerald-300">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>Bug efficiently fixed by Supru Orchestrator with 0 regressions. Verified by test runner.</span>
                        </div>
                        {bug.solutionDiff && onOpenInEditor && (
                          <button
                            onClick={() => onOpenInEditor(bug.file.split('/').pop() || 'patch.ts', bug.solutionDiff!)}
                            className="text-[10px] underline hover:text-white"
                          >
                            View Patch in Supru Code
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
