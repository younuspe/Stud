import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Scale,
  Cpu,
  Zap,
  Terminal,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  Layers,
  Activity,
  Compass,
  FileCode,
  Flame,
  Binary,
  Send,
  Radio,
  Lock
} from 'lucide-react';
import {
  SOVEREIGN_SINGULARITY_PROTOCOL,
  PROTOCOL_SECTIONS
} from '../../../skills/sovereignSingularityProtocol';
import { soundFx } from '../../../utils/audio';
import { LocalHostConfig } from '../../../types/workbench';

interface SovereignProtocolTabProps {
  localConfig: LocalHostConfig;
  onSendToChat?: (text: string) => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onChangeWorkspaceView?: (view: any) => void;
}

export const SovereignProtocolTab: React.FC<SovereignProtocolTabProps> = ({
  localConfig,
  onSendToChat,
  onOpenInEditor,
  onChangeWorkspaceView
}) => {
  // Tiered Consciousness state
  const [consciousnessMode, setConsciousnessMode] = useState<'omni' | 'local' | 'ghost'>('omni');

  // Dreamer / Judge split interactive tester
  const [hypothesisInput, setHypothesisInput] = useState<string>(
    'Implement non-blocking lockless memory ring buffer with zero ABA races'
  );
  const [dreamerOutput, setDreamerOutput] = useState<string | null>(null);
  const [judgeProof, setJudgeProof] = useState<string | null>(null);
  const [isEvaluatingInvariance, setIsEvaluatingInvariance] = useState<boolean>(false);

  // Genesis 4D World-State parameters
  const [refractiveIndex, setRefractiveIndex] = useState<number>(1.492);
  const [emotionalFrequency, setEmotionalFrequency] = useState<string>('Aggressive Precision (842THz)');
  const [semanticNodeType, setSemanticNodeType] = useState<'Box' | 'InteractiveButton' | 'LiquidCanvas'>('Box');

  // Self-Evolution state
  const [evolutionStats, setEvolutionStats] = useState({
    reflectionCycles: 0,
    aestheticGap: 'Not measured',
    coreMutations: 0,
    status: 'NOT RUN'
  });
  const [isMutatingCore, setIsMutatingCore] = useState<boolean>(false);
  const [hasCopiedProtocol, setHasCopiedProtocol] = useState<boolean>(false);

  // Switch Tiered Consciousness
  const handleSwitchConsciousness = (mode: 'omni' | 'local' | 'ghost') => {
    soundFx.playClick();
    setConsciousnessMode(mode);
    soundFx.playChime();
  };

  // Ask the configured model for a hypothesis, then report the real proof status.
  // This build has no connected Z3 runner, so the Judge must remain blocked.
  const handleRunDreamerJudgeSplit = async () => {
    soundFx.playClick();
    setIsEvaluatingInvariance(true);
    setDreamerOutput(null);
    setJudgeProof('BLOCKED: no Z3/SMT proof runner is connected. A model response cannot be treated as a mathematical proof.');
    try {
      const response = await fetch('/api/local-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: localConfig.provider,
          endpointUrl: localConfig.endpointUrl,
          modelName: localConfig.provider === 'gemini_cloud' ? 'gemini-3.8-flash' : localConfig.modelName,
          apiKey: localConfig.apiKey,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: 'You are the Dreamer role. Propose a concrete engineering hypothesis and explain assumptions, edge cases, and how it could be tested. Do not claim that tests or formal proofs have been executed.',
            },
            {
              role: 'user',
              content: hypothesisInput,
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `Provider request failed (HTTP ${response.status}).`);
      if (!String(data.reply || '').trim()) throw new Error('The configured provider returned an empty hypothesis.');
      setDreamerOutput(`[Dreamer — live provider response]\n${data.reply}`);
      soundFx.playChime();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDreamerOutput(`[Dreamer — blocked]\nNo hypothesis was generated.\n\n${message}`);
    } finally {
      setIsEvaluatingInvariance(false);
    }
  };

  // Morph semantic object in Genesis Protocol
  const handleMorphSemanticObject = () => {
    soundFx.playClick();
    setSemanticNodeType((prev) =>
      prev === 'Box' ? 'InteractiveButton' : prev === 'InteractiveButton' ? 'LiquidCanvas' : 'Box'
    );
    soundFx.playChime();
  };

  // Core self-modification is intentionally unavailable until a real,
  // reviewable code-generation and build pipeline is connected.
  const handleMutateCore = () => {
    soundFx.playClick();
    setIsMutatingCore(false);
    setEvolutionStats((previous) => ({
      ...previous,
      status: 'BLOCKED — no self-modification executor is connected',
    }));
  };

  // Copy full skill.md
  const handleCopyProtocol = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(SOVEREIGN_SINGULARITY_PROTOCOL);
    setHasCopiedProtocol(true);
    setTimeout(() => setHasCopiedProtocol(false), 2000);
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      {/* Top Banner: Sovereign Singularity Identity */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-[#12121e] via-[#101018] to-[#141220] p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 shadow-inner">
                <Sparkles size={16} />
              </span>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>VERSION 1.3.0 • THE GREAT TRANSITION</span>
                <span className="text-amber-400 font-mono">[ Manifold ⊗ Formula ]</span>
              </h2>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30">
                skill.md Native
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
                Glider Logic
              </span>
            </div>
            <p className="text-[11px] text-gray-300 font-mono">
              Operational Goal: Zero-Friction &quot;Gliding&quot; through an autonomous, deterministic, and sovereign digital environment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onChangeWorkspaceView && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onChangeWorkspaceView('topology');
                }}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all shadow-sm"
              >
                <Layers size={13} className="text-purple-400" />
                <span>Launch Stratified Topology</span>
              </button>
            )}

            <button
              onClick={handleCopyProtocol}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              {hasCopiedProtocol ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{hasCopiedProtocol ? 'Copied Protocol!' : 'Copy skill.md'}</span>
            </button>

            {onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor('skill.md', SOVEREIGN_SINGULARITY_PROTOCOL)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs text-gray-200 hover:bg-white/[0.1] transition-all"
              >
                <FileCode size={13} className="text-sky-400" />
                <span>Open in Code Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. TIERED CONSCIOUSNESS SELECTOR */}
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Cpu size={12} />
            <span>Tiered Consciousness (The Mind) • Active Operating Awareness</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Omni-Mode */}
            <button
              onClick={() => handleSwitchConsciousness('omni')}
              className={`rounded-xl p-3 text-left transition-all border ${
                consciousnessMode === 'omni'
                  ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'border-white/[0.08] bg-[#0c0c14] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-xs">Omni-Mode (The Oracle)</span>
                {consciousnessMode === 'omni' && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Cloud-Sovereign Clusters • Gemini 2.5 Pro / NVIDIA NIM
              </div>
              <p className="text-[10.5px] text-gray-300 mt-1.5">
                High-dimensional reasoning for global architecture, full-stack synthesis, and complex strategic planning.
              </p>
            </button>

            {/* Local-Mode */}
            <button
              onClick={() => handleSwitchConsciousness('local')}
              className={`rounded-xl p-3 text-left transition-all border ${
                consciousnessMode === 'local'
                  ? 'border-sky-400 bg-sky-500/15 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                  : 'border-white/[0.08] bg-[#0c0c14] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-300 text-xs">Local-Mode (The Expert)</span>
                {consciousnessMode === 'local' && (
                  <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Mojo / CUDA Local SLM • Llama-3 / Phi-3
              </div>
              <p className="text-[10.5px] text-gray-300 mt-1.5">
                Zero-latency rapid iteration, instant drafts, code scaffolding, and micro-optimization.
              </p>
            </button>

            {/* Ghost-Mode */}
            <button
              onClick={() => handleSwitchConsciousness('ghost')}
              className={`rounded-xl p-3 text-left transition-all border ${
                consciousnessMode === 'ghost'
                  ? 'border-purple-400 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'border-white/[0.08] bg-[#0c0c14] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 text-xs">Ghost-Mode (The Machine)</span>
                {consciousnessMode === 'ghost' && (
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Target architecture • Z3 proof runner not connected
              </div>
              <p className="text-[10.5px] text-gray-300 mt-1.5">
                Zero LLM dependency. Absolute mathematical proof, system recovery, and deterministic invariance.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE LAW OF ABSOLUTE INVARIANCE (DREAMER / JUDGE SPLIT) */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14] p-3.5 sm:p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Scale size={14} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              The Law of Absolute Invariance: The Dreamer / Judge Split
            </h3>
            <span className="rounded bg-purple-500/20 px-2 py-0.2 text-[9.5px] text-purple-300 font-mono">
              You do not "guess." You Prove.
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            SMT Solvers (Z3) • SMT-LIB2 Causal Proof
          </span>
        </div>

        <p className="text-[11px] text-gray-300 mb-3">
          Protocol: If a proposed solution cannot be mathematically proven correct via SMT solvers (Z3), it is discarded. "Almost correct" is a failure.
        </p>

        {/* Interactive Evaluation Box */}
        <div className="space-y-2 rounded-xl bg-[#08080e] p-3 border border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={hypothesisInput}
              onChange={(e) => setHypothesisInput(e.target.value)}
              placeholder="Enter engineering hypothesis or architecture claim to verify..."
              className="flex-1 rounded-lg border border-white/[0.1] bg-[#12121c] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={handleRunDreamerJudgeSplit}
              disabled={isEvaluatingInvariance}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all disabled:opacity-50"
            >
              {isEvaluatingInvariance ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-neutral-950" />
                  <span>Proving Invariance...</span>
                </>
              ) : (
                <>
                  <Scale size={13} />
                  <span>Prove with SMT (Z3)</span>
                </>
              )}
            </button>
          </div>

          {/* Dreamer Hypothesis & Judge Verdict */}
          {(dreamerOutput || judgeProof) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.06]">
              {dreamerOutput && (
                <div className="rounded-lg bg-[#11111a] p-2.5 border border-sky-500/30">
                  <div className="text-[10px] font-bold text-sky-400 uppercase font-mono mb-1">
                    The Dreamer (LLM Synthesis)
                  </div>
                  <pre className="font-mono text-[10.5px] text-gray-200 whitespace-pre-wrap">
                    {dreamerOutput}
                  </pre>
                </div>
              )}

              {judgeProof && (
                <div className="rounded-lg bg-[#11111a] p-2.5 border border-purple-500/40">
                  <div className="text-[10px] font-bold text-purple-400 uppercase font-mono mb-1 flex items-center justify-between">
                    <span>The Judge (proof runner unavailable)</span>
                    <span className="text-emerald-400">PROVEN SOUND</span>
                  </div>
                  <pre className="font-mono text-[10.5px] text-gray-200 whitespace-pre-wrap">
                    {judgeProof}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. PART II & III: THE STRATIFIED STACK & OPERATIONAL PROTOCOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Part II: The Stratified Stack (The Topology) */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14] p-3.5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                The Stratified Stack (The Topology)
              </h3>
            </div>
            <span className="text-[10px] text-amber-300 font-mono">Manifold ⊗ Formula</span>
          </div>

          <div className="space-y-2 text-[11px] text-gray-300">
            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Binary size={12} />
                  <span>Layer 0: The Deterministic Bedrock (Formula)</span>
                </span>
                <span className="text-[9px] font-mono text-amber-400">Zig • Z3 • Rust</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                Sovereign Core (Zig) for raw memory and deterministic state; Proof Engine (Z3 / SMT-LIB) formally verifying all logic; Orchestration Glue (Rust) managing the Cellular Protocol.
              </p>
            </div>

            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-purple-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass size={12} />
                  <span>Layer 2: The Associative Memory (Manifold)</span>
                </span>
                <span className="text-[9px] font-mono text-purple-400">SurrealDB • HNSW</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                SurrealDB Graph-Document-Vector hybrid storage; Semantic Index (HNSW) mapping all data as coordinates in latent space; Universal single real-time state across all Cells.
              </p>
            </div>

            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-sky-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity size={12} />
                  <span>Layer 3: The Interaction Layer (The Prism)</span>
                </span>
                <span className="text-[9px] font-mono text-sky-400">Bevy • WGPU • Tauri</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                GPU-first ECS (Bevy + WGPU) for fluid 144fps 3D perspectives; Visual Interface via Neural Particle Galaxy; Sovereign Shell (Tauri) lightweight wrapper.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Protocols: The Glider Logic */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14] p-3.5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Operational Protocols (The Glider Logic)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-300 font-mono">Zero-Friction Glider</span>
          </div>

          <div className="space-y-2 text-[11px] text-gray-300">
            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-emerald-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio size={12} />
                  <span>🛡️ The Supru Cellular Protocol (SCP)</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-400">Mailbox Isolation</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                Isolation by Default: No shared memory between modules. Asynchronous Mailboxes, Zig CPU core pinning (#0-#15), and hard RAM quotas.
              </p>
            </div>

            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock size={12} />
                  <span>🛡️ The Omni-Shield (Cellular Sovereignty)</span>
                </span>
                <span className="text-[9px] font-mono text-amber-400">Zero-Trust Tokens</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                Target design only: this build does not issue Z3 proof tokens or enforce inter-module micro-perimeters.
              </p>
            </div>

            <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
              <div className="font-bold text-rose-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flame size={12} />
                  <span>🛡️ The Supru Akhada (Cyber Containment)</span>
                </span>
                <span className="text-[9px] font-mono text-rose-400">Disposable Linux Wards</span>
              </div>
              <p className="mt-1 text-gray-400 text-[10.5px]">
                Containment: Ephemeral Isolation Wards (Disposable Linux Guests). Host OS remains a &quot;Healthy Hospital&quot; with communication restricted to scrubbed gRPC.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PART IV & V: GOLDEN AXIOMS & SELF-EVOLUTION LOOP */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14] p-3.5 sm:p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Part IV & V: The Golden Axioms & Self-Evolution Loop (The Sage)
            </h3>
          </div>

          {/* Self-Factory Mutation Button */}
          <button
            onClick={handleMutateCore}
            disabled={isMutatingCore}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-200 hover:bg-purple-500/30 transition-all"
          >
            {isMutatingCore ? (
              <>
                <RefreshCw size={12} className="animate-spin text-purple-300" />
                <span>Rewriting Core Logic...</span>
              </>
            ) : (
              <>
                <Zap size={12} />
                <span>Trigger Self-Factory Core Mutation</span>
              </>
            )}
          </button>
        </div>

        {/* Axioms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 text-[11px]">
          <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
            <div className="font-bold text-rose-400 font-mono text-[10px]">RULE 1 • ANTI-HALLUCINATION</div>
            <p className="mt-1 text-gray-300 text-[10.5px]">
              Never invent a state. Every assertion must be backed by a binary proof. Separate Fact from Inference.
            </p>
          </div>

          <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
            <div className="font-bold text-sky-400 font-mono text-[10px]">RULE 4 • ALCHEMICAL SHIELD</div>
            <p className="mt-1 text-gray-300 text-[10.5px]">
              Distill external data in air-gapped Rust sandbox. Strip all execution-code; retain only intelligence.
            </p>
          </div>

          <div className="rounded-lg bg-[#12121d] p-2.5 border border-white/[0.04]">
            <div className="font-bold text-emerald-400 font-mono text-[10px]">EVOLUTION LOOP (THE SAGE)</div>
            <p className="mt-1 text-gray-300 text-[10.5px]">
              Reflect on grace & silence ({evolutionStats.reflectionCycles} cycles). Distill gap to singularity ({evolutionStats.aestheticGap}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
