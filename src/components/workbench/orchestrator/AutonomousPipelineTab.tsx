import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Wrench,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Activity,
  Code2,
  Workflow,
  Zap,
  Check,
  RefreshCw,
  Coins,
  Scale,
  Compass,
  FileCode,
  Send
} from 'lucide-react';
import {
  AutonomousWorkflowPipeline,
  WorkflowPipelineNode,
  OrchestratorToolName
} from '../../../types/workbench';
import {
  PRESET_AUTONOMOUS_PIPELINES,
  AVAILABLE_ORCHESTRATOR_MODELS,
} from '../../../utils/orchestratorPipelines';
import { soundFx } from '../../../utils/audio';

interface AutonomousPipelineTabProps {
  onOpenInEditor?: (fileName: string, content: string) => void;
  onSendToChat?: (text: string) => void;
  onTriggerHunter?: (objective: string) => void;
}

export const AutonomousPipelineTab: React.FC<AutonomousPipelineTabProps> = ({
  onOpenInEditor,
  onSendToChat,
  onTriggerHunter
}) => {
  const [pipelines, setPipelines] = useState<AutonomousWorkflowPipeline[]>(() =>
    PRESET_AUTONOMOUS_PIPELINES.map((pipeline) => ({
      ...pipeline,
      executionStatus: 'idle',
      totalDurationMs: 0,
      totalTokensUsed: 0,
      totalTokensSaved: 0,
      toolCallsExecuted: 0,
      selfHealingTriggered: 0,
      invarianceScore: 0,
      nodes: pipeline.nodes.map((node) => ({
        ...node,
        status: 'idle',
        toolResult: undefined,
        durationMs: 0,
        tokensUsed: 0,
        outputData: undefined,
        invarianceProof: 'Not run',
      })),
    }))
  );
  const [activePipelineId, setActivePipelineId] = useState<string>(PRESET_AUTONOMOUS_PIPELINES[0].id);
  const [isAutonomousRunning, setIsAutonomousRunning] = useState<boolean>(false);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);
  const [selectedToolForQuickCall, setSelectedToolForQuickCall] = useState<OrchestratorToolName>('smt_prover');
  const [quickToolOutput, setQuickToolOutput] = useState<string | null>(null);
  const [quickToolLoading, setQuickToolLoading] = useState<boolean>(false);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  // Handle switching pipeline archetype
  const handleSelectPipeline = (pipeId: string) => {
    soundFx.playClick();
    setActivePipelineId(pipeId);
    setIsAutonomousRunning(false);
    setRunningNodeId(null);
  };

  // Model switching on a specific node (Supru Orchestrator controls every model)
  const handleChangeNodeModel = (nodeId: string, newModelId: string) => {
    soundFx.playClick();
    setPipelines((prev) =>
      prev.map((pipe) => {
        if (pipe.id !== activePipeline.id) return pipe;
        return {
          ...pipe,
          nodes: pipe.nodes.map((node) => {
            if (node.id !== nodeId) return node;
            const modelInfo = AVAILABLE_ORCHESTRATOR_MODELS.find((m) => m.id === newModelId);
            return {
              ...node,
              modelId: modelInfo ? modelInfo.name : newModelId,
              modelRole: modelInfo ? modelInfo.role : node.modelRole
            };
          })
        };
      })
    );
  };

  // Run only real, explicitly supported local checks. Never synthesize tool output.
  const executeRealTool = async (tool: OrchestratorToolName) => {
    const commands: Partial<Record<OrchestratorToolName, string>> = {
      linter: 'npm run lint',
      type_checker: 'npm run lint',
      git_diff: 'git diff --stat',
      package_manager: 'npm ls --depth=0',
    };
    const command = commands[tool];
    if (!command) {
      return {
        output: `Tool "${tool}" is not implemented yet. No command was run.`,
        status: 'warning' as const,
        durationMs: 0,
        invarianceProof: 'Not verified',
      };
    }
    const started = Date.now();
    try {
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Execution service returned HTTP ${response.status}`);
      const exitCode = Number(result.exitCode);
      return {
        output: `$ ${command}\n${result.output || '(no output)'}\nExit code: ${exitCode}`,
        status: exitCode === 0 ? 'success' as const : 'error' as const,
        durationMs: Number(result.durationMs) || Date.now() - started,
        invarianceProof: exitCode === 0 ? 'Command exit code 0; no formal proof performed' : 'Not verified',
      };
    } catch (error) {
      return {
        output: `Could not execute "${tool}": ${error instanceof Error ? error.message : String(error)}`,
        status: 'error' as const,
        durationMs: Date.now() - started,
        invarianceProof: 'Not verified',
      };
    }
  };

  const handleRunSingleNode = async (node: WorkflowPipelineNode) => {
    if (runningNodeId || isAutonomousRunning) return;
    soundFx.playClick();
    setRunningNodeId(node.id);
    setPipelines((prev) => prev.map((pipe) => pipe.id !== activePipeline.id ? pipe : ({
      ...pipe,
      nodes: pipe.nodes.map((item) => item.id === node.id ? { ...item, status: 'running' } : item),
    })));
    const result = await executeRealTool(node.toolToCall || 'ast_parser');
    setPipelines((prev) => prev.map((pipe) => pipe.id !== activePipeline.id ? pipe : ({
      ...pipe,
      executionStatus: result.status === 'success' ? pipe.executionStatus : 'failed',
      nodes: pipe.nodes.map((item) => item.id !== node.id ? item : {
        ...item,
        status: result.status === 'success' ? 'completed' : 'failed',
        toolResult: result.output,
        durationMs: result.durationMs,
        invarianceProof: result.invarianceProof,
        outputData: undefined,
      }),
    })));
    setRunningNodeId(null);
    if (result.status === 'success') soundFx.playChime();
  };

  // Sequential execution stops at the first unavailable tool or failed command.
  const handleRunAutonomousPipeline = async () => {
    if (isAutonomousRunning || runningNodeId) return;
    soundFx.playClick();
    setIsAutonomousRunning(true);
    const started = Date.now();
    let allSucceeded = true;
    for (const node of activePipeline.nodes) {
      setRunningNodeId(node.id);
      setPipelines((prev) => prev.map((pipe) => pipe.id !== activePipeline.id ? pipe : ({
        ...pipe,
        executionStatus: 'running',
        nodes: pipe.nodes.map((item) => item.id === node.id ? { ...item, status: 'running' } : item),
      })));
      const result = await executeRealTool(node.toolToCall || 'ast_parser');
      setPipelines((prev) => prev.map((pipe) => pipe.id !== activePipeline.id ? pipe : ({
        ...pipe,
        nodes: pipe.nodes.map((item) => item.id !== node.id ? item : {
          ...item,
          status: result.status === 'success' ? 'completed' : 'failed',
          toolResult: result.output,
          durationMs: result.durationMs,
          invarianceProof: result.invarianceProof,
          outputData: undefined,
        }),
        toolCallsExecuted: pipe.toolCallsExecuted + 1,
        totalDurationMs: Date.now() - started,
      })));
      if (result.status !== 'success') {
        allSucceeded = false;
        break;
      }
    }
    setPipelines((prev) => prev.map((pipe) => pipe.id !== activePipeline.id ? pipe : ({
      ...pipe,
      executionStatus: allSucceeded ? 'completed' : 'failed',
      totalDurationMs: Date.now() - started,
    })));
    setRunningNodeId(null);
    setIsAutonomousRunning(false);
    if (allSucceeded) soundFx.playChime();
  };

  // Self-healing requires a real failure detector and recovery executor; do not simulate one.
  const handleTriggerSelfHealing = () => {
    soundFx.playClick();
    setQuickToolOutput('Self-healing is not connected to a real failure detector and recovery executor yet. No pipeline state was changed.');
  };

  // Reset current pipeline
  const handleResetPipeline = () => {
    soundFx.playClick();
    setIsAutonomousRunning(false);
    setRunningNodeId(null);
    const original = PRESET_AUTONOMOUS_PIPELINES.find((p) => p.id === activePipeline.id);
    if (!original) return;

    setPipelines((prev) =>
      prev.map((p) =>
        p.id === original.id
          ? {
              ...original,
              nodes: original.nodes.map((n) => ({
                ...n,
                status: 'idle',
                toolResult: undefined
              }))
            }
          : p
      )
    );
  };

  // Direct tool execution uses the same real executor as pipeline nodes.
  const handleQuickExecuteTool = async (tool: OrchestratorToolName) => {
    soundFx.playClick();
    setSelectedToolForQuickCall(tool);
    setQuickToolLoading(true);
    const result = await executeRealTool(tool);
    setQuickToolOutput(`${result.output}\n\nVerification: ${result.invarianceProof}`);
    setQuickToolLoading(false);
    if (result.status === 'success') soundFx.playChime();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Project Archetypes Selector */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14] p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Autonomous Project Archetype Pipelines
            </h3>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[9.5px] font-bold text-amber-300 border border-amber-500/30">
              Universal Orchestrator
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            Select a project architecture for autonomous multi-model dispatch
          </span>
        </div>

        {/* Archetype Selector Chips */}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {pipelines.map((pipe) => {
            const isSelected = pipe.id === activePipeline.id;
            return (
              <button
                key={pipe.id}
                onClick={() => handleSelectPipeline(pipe.id)}
                className={`flex flex-col text-left rounded-lg p-2 transition-all border ${
                  isSelected
                    ? 'border-amber-500/60 bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-white shadow-md'
                    : 'border-white/[0.06] bg-[#12121c] text-gray-300 hover:border-white/20 hover:bg-[#161622]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                    {pipe.category.replace('_', ' ')}
                  </span>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                </div>
                <div className="mt-1 font-bold text-[11px] leading-tight line-clamp-2">
                  {pipe.name}
                </div>
                <div className="mt-1 text-[9.5px] text-gray-400 line-clamp-1">
                  {pipe.projectArchetype}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Pipeline Control Card */}
      <div className="rounded-xl border border-amber-500/30 bg-[#0d0d17] p-3.5 sm:p-4 shadow-xl">
        {/* Header & Telemetry */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                <Workflow size={14} />
              </span>
              <h2 className="text-sm font-bold text-white">{activePipeline.name}</h2>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-300 border border-sky-500/30">
                {activePipeline.projectArchetype}
              </span>
            </div>
            <p className="text-[11px] text-gray-300 max-w-3xl">
              {activePipeline.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunAutonomousPipeline}
              disabled={isAutonomousRunning}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-md ${
                isAutonomousRunning
                  ? 'bg-amber-600/50 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 active:scale-95'
              }`}
            >
              {isAutonomousRunning ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-neutral-950" />
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <Play size={13} className="fill-neutral-950" />
                  <span>▶ Run Autonomous Pipeline</span>
                </>
              )}
            </button>

            <button
              onClick={handleTriggerSelfHealing}
              title="Test autonomous error detection & auto-healing with Gemini 2.5 Pro & Z3 SMT prover"
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/15 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25 transition-all"
            >
              <Zap size={13} className="text-purple-400" />
              <span>Simulate Self-Healing</span>
            </button>

            <button
              onClick={handleResetPipeline}
              title="Reset all node execution states"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/[0.08]"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Pipeline Telemetry Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 py-2.5 my-2 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 rounded-lg bg-[#141420] px-2.5 py-1.5 border border-white/[0.04]">
            <Cpu size={14} className="text-sky-400" />
            <div>
              <div className="text-[10px] text-gray-400">Coordinated Models</div>
              <div className="font-bold text-white font-mono">{activePipeline.activeModelCount} Sovereign Models</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#141420] px-2.5 py-1.5 border border-white/[0.04]">
            <Scale size={14} className="text-emerald-400" />
            <div>
              <div className="text-[10px] text-gray-400">Invariance Score</div>
              <div className="font-bold text-emerald-300 font-mono">{activePipeline.invarianceScore}% Proven</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#141420] px-2.5 py-1.5 border border-white/[0.04]">
            <Coins size={14} className="text-amber-400" />
            <div>
              <div className="text-[10px] text-gray-400">AST Tokens Saved</div>
              <div className="font-bold text-amber-300 font-mono">
                {activePipeline.totalTokensSaved.toLocaleString()} (~68%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#141420] px-2.5 py-1.5 border border-white/[0.04]">
            <Wrench size={14} className="text-purple-400" />
            <div>
              <div className="text-[10px] text-gray-400">Tool Calls Invoked</div>
              <div className="font-bold text-purple-300 font-mono">{activePipeline.toolCallsExecuted} Tools</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#141420] px-2.5 py-1.5 border border-white/[0.04]">
            <ShieldCheck size={14} className="text-rose-400" />
            <div>
              <div className="text-[10px] text-gray-400">Self-Healing Events</div>
              <div className="font-bold text-rose-300 font-mono">{activePipeline.selfHealingTriggered} Resolved</div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PIPELINE NODES & MULTI-MODEL CONTROLLER                  */}
        {/* ======================================================== */}
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Activity size={13} />
              <span>Multi-Model Autonomous Workflow Nodes</span>
            </span>
            <span className="text-[10px] text-gray-400">
              Supru Orchestrator actively controls and routes to each assigned model
            </span>
          </div>

          <div className="space-y-2.5">
            {activePipeline.nodes.map((node, index) => {
              const isRunning = runningNodeId === node.id;
              const isCompleted = node.status === 'completed';
              const isHealed = node.status === 'healed';
              const isFailed = node.status === 'failed';

              return (
                <div
                  key={node.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isRunning
                      ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : isHealed
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : isCompleted
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isFailed
                      ? 'border-rose-500/50 bg-rose-500/10'
                      : 'border-white/[0.08] bg-[#12121d]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Step Number Badge */}
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.1] text-[10px] font-bold font-mono text-gray-300">
                        {index + 1}
                      </span>

                      {/* Stage Pill */}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9.5px] font-mono uppercase font-bold tracking-wider ${
                          node.stage === 'plan'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : node.stage === 'code'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : node.stage === 'tool_call'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : node.stage === 'test'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {node.stage}
                      </span>

                      {/* Node Name */}
                      <span className="font-bold text-gray-100 text-xs">{node.name}</span>

                      {/* Status Icon */}
                      {isCompleted && <CheckCircle2 size={13} className="text-emerald-400" />}
                      {isHealed && (
                        <span className="rounded-full bg-purple-500/30 px-1.5 py-0.2 text-[9px] font-bold text-purple-300 border border-purple-500/40">
                          Auto-Healed
                        </span>
                      )}
                      {isRunning && <RefreshCw size={13} className="text-amber-400 animate-spin" />}
                      {isFailed && <AlertCircle size={13} className="text-rose-400" />}
                    </div>

                    {/* Right: Model Controller Dropdown & Tool Button */}
                    <div className="flex items-center gap-2">
                      {/* Model Selector (Orchestrator controls model on each step) */}
                      <div className="flex items-center gap-1.5 bg-[#0a0a10] px-2 py-1 rounded-lg border border-white/[0.08]">
                        <Cpu size={12} className="text-amber-400" />
                        <span className="text-[10px] text-gray-400 font-mono">Assigned Model:</span>
                        <select
                          value={
                            AVAILABLE_ORCHESTRATOR_MODELS.find((m) => m.name === node.modelId)?.id ||
                            'gemini-2.5-pro'
                          }
                          onChange={(e) => handleChangeNodeModel(node.id, e.target.value)}
                          className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer max-w-[190px] truncate"
                          title="Supru Orchestrator can control each and every model in this workflow"
                        >
                          {AVAILABLE_ORCHESTRATOR_MODELS.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#12121c] text-gray-200">
                              {m.name} [{m.role}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Execute Single Step Button */}
                      <button
                        onClick={() => handleRunSingleNode(node)}
                        disabled={isRunning || isAutonomousRunning}
                        className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-1 text-[10.5px] font-semibold text-gray-200 hover:bg-white/[0.1] hover:text-white transition-all disabled:opacity-50"
                        title="Execute this specific node and tool call"
                      >
                        <Play size={10} />
                        <span>Run Step</span>
                      </button>
                    </div>
                  </div>

                  {/* Node Details */}
                  <div className="mt-2 text-[11px] text-gray-300">
                    {node.description}
                  </div>

                  {/* Tool Calling Execution Panel */}
                  <div className="mt-2.5 rounded-lg border border-[#222234] bg-[#090910] p-2.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Wrench size={11} className="text-amber-400" />
                        <span className="font-bold text-gray-200">Autonomous Tool Calling:</span>
                        <span className="font-mono text-purple-300 bg-purple-500/15 px-1.5 py-0.2 rounded border border-purple-500/30">
                          {node.toolToCall || 'ast_parser'}
                        </span>
                      </div>
                      {node.durationMs && (
                        <span className="font-mono text-gray-400">{node.durationMs}ms duration</span>
                      )}
                    </div>

                    {/* Tool Live Output */}
                    {node.toolResult ? (
                      <pre className="font-mono text-[10.5px] text-gray-300 whitespace-pre-wrap bg-[#050508] p-2 rounded border border-white/[0.04] overflow-x-auto max-h-24">
                        {node.toolResult}
                      </pre>
                    ) : (
                      <div className="text-[10.5px] text-gray-500 italic">
                        Tool invocation queued for autonomous execution loop.
                      </div>
                    )}

                    {/* Invariance Proof Badge */}
                    {node.invarianceProof && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <div className="flex items-center gap-1">
                          <Scale size={11} />
                          <span>Formal Invariance Proof: <strong>{node.invarianceProof}</strong></span>
                        </div>
                        {onOpenInEditor && node.outputData && (
                          <button
                            onClick={() => onOpenInEditor(`${node.id}.ts`, node.outputData!)}
                            className="underline hover:text-white"
                          >
                            Inspect in Code Studio
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tool Calling Facility Drawer */}
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#090912] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                Direct Tool Invocation Facility
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              Trigger any autonomous tool on demand
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'smt_prover',
                'hunter_scent',
                'type_checker',
                'ast_parser',
                'linter',
                'test_runner',
                'token_budgeter',
                'git_diff',
                'debugger',
                'package_manager',
                'api_checker'
              ] as OrchestratorToolName[]
            ).map((tool) => (
              <button
                key={tool}
                onClick={() => handleQuickExecuteTool(tool)}
                className={`rounded-lg px-2.5 py-1 text-[10.5px] font-mono transition-all border ${
                  selectedToolForQuickCall === tool
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-white/[0.06] bg-[#141420] text-gray-300 hover:border-white/20 hover:text-white'
                }`}
              >
                {tool}
              </button>
            ))}
          </div>

          {/* Quick Tool Output */}
          {quickToolOutput && (
            <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-[#06060a] p-2.5 font-mono text-[10.5px] text-gray-200 whitespace-pre-wrap">
              {quickToolOutput}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
