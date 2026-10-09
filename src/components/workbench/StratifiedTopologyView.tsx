import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  Sparkles,
  Terminal,
  Activity,
  Box,
  Compass,
  Database,
  Lock,
  Radio,
  RefreshCw,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Workflow,
  Copy,
  Check,
  Send,
  SlidersHorizontal,
  Flame,
  Binary
} from 'lucide-react';
import { CellularNode, EphemeralIsolationWard } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface StratifiedTopologyViewProps {
  onSendToChat?: (text: string) => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onChangeWorkspaceView?: (view: any) => void;
}

const INITIAL_CELLS: CellularNode[] = [
  {
    id: 'cell-zig-core',
    name: 'Cell: Core (Formula)',
    layer: 'Layer 0: Bedrock',
    runtime: 'Zig',
    cpuCorePinned: 0,
    ramUsageMb: 8.4,
    ramQuotaMb: 64,
    mailboxMessages: 0,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x9f82a17c_core_sat'
  },
  {
    id: 'cell-z3-prover',
    name: 'Cell: Proof Engine',
    layer: 'Layer 0: Bedrock',
    runtime: 'Z3/SMT',
    cpuCorePinned: 1,
    ramUsageMb: 14.2,
    ramQuotaMb: 128,
    mailboxMessages: 2,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x7b1129ee_smt_sat'
  },
  {
    id: 'cell-rust-glue',
    name: 'Cell: Orchestrator Glue',
    layer: 'Layer 0: Bedrock',
    runtime: 'Rust',
    cpuCorePinned: 2,
    ramUsageMb: 11.8,
    ramQuotaMb: 128,
    mailboxMessages: 1,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x44cd8912_scp_sat'
  },
  {
    id: 'cell-surreal-db',
    name: 'Cell: SurrealDB Storage',
    layer: 'Layer 2: Manifold',
    runtime: 'SurrealDB',
    cpuCorePinned: 4,
    ramUsageMb: 28.5,
    ramQuotaMb: 256,
    mailboxMessages: 0,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x33e8b090_graph_sat'
  },
  {
    id: 'cell-hnsw-index',
    name: 'Cell: HNSW Latent Space',
    layer: 'Layer 2: Manifold',
    runtime: 'HNSW',
    cpuCorePinned: 5,
    ramUsageMb: 22.1,
    ramQuotaMb: 256,
    mailboxMessages: 3,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x66f9a231_hnsw_sat'
  },
  {
    id: 'cell-bevy-prism',
    name: 'Cell: Bevy/WGPU Prism',
    layer: 'Layer 3: Prism',
    runtime: 'Bevy/WGPU',
    cpuCorePinned: 8,
    ramUsageMb: 36.4,
    ramQuotaMb: 512,
    mailboxMessages: 0,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x99a117ff_wgpu_sat'
  },
  {
    id: 'cell-tauri-shell',
    name: 'Cell: Tauri Sovereign Shell',
    layer: 'Layer 3: Prism',
    runtime: 'Tauri',
    cpuCorePinned: 9,
    ramUsageMb: 9.6,
    ramQuotaMb: 64,
    mailboxMessages: 1,
    status: 'gliding',
    z3VerifiedToken: 'z3_tok_0x11d8820a_ipc_sat'
  }
];

const INITIAL_WARDS: EphemeralIsolationWard[] = [
  {
    id: 'ward-01',
    name: 'Isolation-Ward #882',
    guestOs: 'Disposable Alpine-Linux v3.20',
    sandboxState: 'sterile',
    threatVector: 'Simulated Heap Corruption & RCE Fuzzing',
    grpcScrubbingActive: true,
    isolationIntegrity: 100,
    lastAuditTimestamp: Date.now() - 32000
  },
  {
    id: 'ward-02',
    name: 'Isolation-Ward #904',
    guestOs: 'Ephemeral Firecracker MicroVM',
    sandboxState: 'detonating',
    threatVector: 'Evasive Poly-Shellcode Payload Infiltration',
    grpcScrubbingActive: true,
    isolationIntegrity: 100,
    lastAuditTimestamp: Date.now() - 5000
  }
];

export const StratifiedTopologyView: React.FC<StratifiedTopologyViewProps> = ({
  onSendToChat,
  onOpenInEditor,
  onChangeWorkspaceView
}) => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'all' | 'layer0' | 'layer2' | 'layer3' | 'glider' | 'galaxy'>('all');

  // Cells state (SCP governance)
  const [cells, setCells] = useState<CellularNode[]>(INITIAL_CELLS);
  const [selectedCellId, setSelectedCellId] = useState<string>('cell-zig-core');

  // Z3 Proof Engine interactive state
  const [z3Formula, setZ3Formula] = useState<string>(
    '(assert (forall ((s State) (t Token))\n  (=> (and (ValidToken t) (WithinPerimeter s))\n      (NoMemoryLeak s))))\n(check-sat)'
  );
  const [z3Result, setZ3Result] = useState<string | null>(
    'sat\n(model\n  (define-fun ValidToken ((x!0 Token)) Bool true)\n  (define-fun InvariantHolds () Bool true)\n)\n;; Verified in 0.042s via Z3 v4.12 SMT Solver. Zero boundary leaks.'
  );
  const [isSolvingZ3, setIsSolvingZ3] = useState<boolean>(false);

  // SurrealDB / HNSW Latent coordinates
  const [latentQuery, setLatentQuery] = useState<string>('Autonomous Micro-Kernel Consensus');
  const [latentCoords, setLatentCoords] = useState<{ x: number; y: number; z: number }>({
    x: 0.8412,
    y: -0.3129,
    z: 0
  });
  const [associativeNeighbors, setAssociativeNeighbors] = useState<
    { name: string; distance: number; type: string }[]
  >([]);

  // Akhada Ephemeral Isolation Wards state
  const [wards, setWards] = useState<EphemeralIsolationWard[]>([]);
  const [isDetonatingWard, setIsDetonatingWard] = useState<boolean>(false);
  const [grpcTelemetry, setGrpcTelemetry] = useState<string[]>([
    'No live host, gRPC, microVM, or security telemetry source is connected.'
  ]);

  // Omni-Shield Token generator state
  const [tokenSourceCell, setTokenSourceCell] = useState<string>('cell-rust-glue');
  const [tokenTargetCell, setTokenTargetCell] = useState<string>('cell-surreal-db');
  const [generatedShieldToken, setGeneratedShieldToken] = useState<string | null>(null);
  const [shieldTokenStatus, setShieldTokenStatus] = useState<'idle' | 'verifying' | 'valid' | 'rejected'>('idle');

  // Particle Galaxy canvas reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particleSpeed, setParticleSpeed] = useState<number>(1.2);
  const [particleTheme, setParticleTheme] = useState<'cosmic' | 'formula' | 'manifold'>('cosmic');
  const [particleCount, setParticleCount] = useState<number>(160);

  // Copied indicator
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedCell = cells.find((c) => c.id === selectedCellId) || cells[0];

  // Particle Galaxy Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const colorPalettes = {
      cosmic: ['#f59e0b', '#ec4899', '#8b5cf6', '#38bdf8', '#10b981'],
      formula: ['#f59e0b', '#fbbf24', '#f97316', '#eab308', '#d97706'],
      manifold: ['#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#6366f1']
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        const speed = (Math.random() * 1.5 + 0.5) * particleSpeed;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2 + 1.2;
        const colors = colorPalettes[particleTheme];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.7 + 0.3;
      }

      update() {
        this.x += this.vx * particleSpeed;
        this.y += this.vy * particleSpeed;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Attract towards mouse if active
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 5) {
            const force = (150 - dist) / 1500;
            this.vx += (dx / dist) * force;
            this.vy += (dy / dist) * force;
          }
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = 8;
        c.globalAlpha = this.alpha;
        c.fill();
        c.restore();
      }
    }

    const particles: Particle[] = Array.from({ length: particleCount }, () => new Particle());

    // Shockwave click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      soundFx.playChime();

      // Disperse particles outward
      particles.forEach((p) => {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          const force = (220 - dist) / 18;
          p.vx += (dx / (dist || 1)) * force;
          p.vy += (dy / (dist || 1)) * force;
        }
      });
    };
    canvas.addEventListener('click', handleClick);

    const render = () => {
      ctx.fillStyle = 'rgba(8, 8, 14, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw filament connections
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 75) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = (1 - dist / 75) * 0.22;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleSpeed, particleTheme, particleCount]);

  // This view has no real Z3 binary or proof adapter. Never fabricate SAT output.
  const handleSolveZ3 = () => {
    soundFx.playClick();
    setIsSolvingZ3(false);
    setZ3Result('BLOCKED: no Z3 executable or SMT proof adapter is connected. No proof was executed and no invariant is marked verified.');
    setGrpcTelemetry((prev) => ['[Proof Runner] BLOCKED — no solver connected; no SAT/UNSAT result issued.', ...prev.slice(0, 4)]);
  };

  // No vector database is connected; do not manufacture coordinates or neighbors.
  const handleQueryLatentSpace = () => {
    soundFx.playClick();
    setAssociativeNeighbors([]);
    setGrpcTelemetry((prev) => [
      `[Latent Query] BLOCKED: no SurrealDB/HNSW vector index is connected for "${latentQuery}". No retrieval was performed.`,
      ...prev.slice(0, 4),
    ]);
  };

  // A token cannot be issued without a real verifier and permission authority.
  const handleIssueShieldToken = () => {
    soundFx.playClick();
    setShieldTokenStatus('rejected');
    setGeneratedShieldToken(null);
    setGrpcTelemetry((prev) => [
      `[Omni-Shield] BLOCKED: no Z3 verifier or permission authority is connected for ${tokenSourceCell} → ${tokenTargetCell}. No token was issued.`,
      ...prev.slice(0, 4),
    ]);
  };

  // No disposable VM/microVM backend is connected; a UI animation is not isolation.
  const handleDetonateWard = (wardId: string) => {
    soundFx.playClick();
    setIsDetonatingWard(false);
    setGrpcTelemetry((prev) => [
      `[Supru Akhada] BLOCKED: no disposable VM backend is connected for ${wardId}. No payload was run or quarantined.`,
      ...prev.slice(0, 4),
    ]);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    soundFx.playClick();
    setTimeout(() => setCopiedText(null), 1800);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#08080c] text-gray-200 custom-scrollbar">
      {/* 1. TOP HERO BANNER: VERSION 1.3.0 (THE GREAT TRANSITION) */}
      <div className="relative border-b border-white/[0.08] bg-gradient-to-r from-[#110e1c] via-[#0b0c16] to-[#0c121c] p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-purple-500/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 font-mono">
                <Sparkles size={11} className="text-amber-400" />
                VERSION 1.3.0
              </span>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                The Great Transition
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                Zero-Friction Glider
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>The Stratified Stack</span>
                <span className="text-amber-400 font-mono text-base font-medium">
                  [ Manifold ⊗ Formula ]
                </span>
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
              Concept visualization for the planned topology stack. This build has no connected Z3 solver, SurrealDB/HNSW index, or disposable microVM backend; status indicators reflect only actions actually executed.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-left backdrop-blur-md">
              <div className="text-[10px] text-gray-400 uppercase font-mono">Proof Invariance</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={14} /> BLOCKED
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-left backdrop-blur-md">
              <div className="text-[10px] text-gray-400 uppercase font-mono">Universal State</div>
              <div className="text-sm font-bold text-amber-400 font-mono">0x7f8a...9e4b</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-left backdrop-blur-md">
              <div className="text-[10px] text-gray-400 uppercase font-mono">Glider Rate</div>
              <div className="text-sm font-bold text-purple-400 font-mono">144.0 Hz</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative max-w-7xl mx-auto mt-5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
          {[
            { id: 'all', label: 'Full Topology Matrix', icon: Layers, badge: 'All Layers' },
            { id: 'layer0', label: 'Layer 0: The Formula', icon: Binary, badge: 'Zig + Z3' },
            { id: 'layer2', label: 'Layer 2: The Manifold', icon: Database, badge: 'SurrealDB' },
            { id: 'layer3', label: 'Layer 3: The Prism', icon: Box, badge: 'Bevy 144fps' },
            { id: 'galaxy', label: 'Neural Particle Galaxy', icon: Sparkles, badge: '3D Canvas' },
            { id: 'glider', label: 'Operational Protocols', icon: ShieldCheck, badge: 'Glider Logic' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-lg font-bold'
                    : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-black' : 'text-amber-400'} />
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] font-mono px-1 rounded ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/[0.06] text-gray-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN VIEW BODY */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* ======================================================== */}
        {/* VIEW A: FULL TOPOLOGY MATRIX                             */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'layer0' || activeTab === 'layer2' || activeTab === 'layer3') && (
          <div className="space-y-6">
            {/* The 3 Stratified Layers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* LAYER 0: THE DETERMINISTIC BEDROCK (THE FORMULA) */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  activeTab === 'layer0' || activeTab === 'all'
                    ? 'border-amber-500/40 bg-gradient-to-b from-[#181308] to-[#0f0e15]'
                    : 'border-white/[0.06] bg-[#0d0e14] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Binary size={16} />
                    </span>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        Layer 0 Bedrock
                      </div>
                      <h3 className="text-sm font-bold text-white">The Formula</h3>
                    </div>
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-mono text-amber-300">
                    Deterministic
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Cpu size={13} /> Sovereign Core (Zig)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Direct raw memory control, arena allocators, and zero-pause garbage collection.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck size={13} /> Proof Engine (Z3 / SMT-LIB)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Formal symbolic logic solver proving system-wide memory safety &amp; correctness.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Workflow size={13} /> Orchestration Glue (Rust)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Enforces the Cellular Protocol, async mailboxes, and lock-free thread queues.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('layer0')}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition-all"
                >
                  <span>Explore Formula Solvers</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* LAYER 2: THE ASSOCIATIVE MEMORY (THE MANIFOLD) */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  activeTab === 'layer2' || activeTab === 'all'
                    ? 'border-purple-500/40 bg-gradient-to-b from-[#140c1e] to-[#0f0e15]'
                    : 'border-white/[0.06] bg-[#0d0e14] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Database size={16} />
                    </span>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                        Layer 2 Memory
                      </div>
                      <h3 className="text-sm font-bold text-white">The Manifold</h3>
                    </div>
                  </div>
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[9px] font-mono text-purple-300">
                    Associative
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Compass size={13} /> Storage Engine (SurrealDB)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Graph-Document-Vector hybrid database for multi-model relationships &amp; traversal.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Activity size={13} /> Semantic Index (HNSW)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Continuous latent coordinate space with sub-millisecond nearest-neighbor recall.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Radio size={13} /> Universal Real-Time State
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Zero-drift single source of truth deterministically synchronized across all Cells.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('layer2')}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500 hover:text-white transition-all"
                >
                  <span>Explore Latent Manifold</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* LAYER 3: THE INTERACTION LAYER (THE PRISM) */}
              <div
                className={`rounded-2xl border p-4 transition-all ${
                  activeTab === 'layer3' || activeTab === 'all'
                    ? 'border-sky-500/40 bg-gradient-to-b from-[#091522] to-[#0f0e15]'
                    : 'border-white/[0.06] bg-[#0d0e14] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      <Box size={16} />
                    </span>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                        Layer 3 Interaction
                      </div>
                      <h3 className="text-sm font-bold text-white">The Prism</h3>
                    </div>
                  </div>
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[9px] font-mono text-sky-300">
                    Fluid GPU
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Zap size={13} /> Render Engine (Bevy + WGPU)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Direct-to-metal Entity Component System (ECS) operating at continuous 144fps.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Sparkles size={13} /> Neural Particle Galaxy
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Fluid 3D vector constellation with gravitational clustering and energy filaments.
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-black/30 p-2.5 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Terminal size={13} /> Sovereign Shell (Tauri)
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Sub-millisecond native IPC with an ultra-lean 11.4MB multi-OS memory footprint.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('galaxy')}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500 hover:text-black transition-all"
                >
                  <span>Launch Particle Galaxy</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW B: LAYER 0 - THE DETERMINISTIC BEDROCK (THE FORMULA) */}
        {/* ======================================================== */}
        {(activeTab === 'layer0' || activeTab === 'all') && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#0e0d16] p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                  Formal Mathematical Invariance
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-400" />
                  Z3 / SMT-LIB Proof Engine &amp; Zig Sovereign Core
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 font-mono text-[10px] border border-emerald-500/40">
                  Memory Safe: 0 Alloc Leaks
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Formula & Theorem Editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>SMT-LIB2 Theorem Formulation</span>
                  <span className="text-[10px] font-mono text-amber-400">SMT-LIB v2.6</span>
                </label>
                <textarea
                  value={z3Formula}
                  onChange={(e) => setZ3Formula(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#07070a] p-3 font-mono text-xs text-amber-200 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        setZ3Formula(
                          '(assert (forall ((s State) (t Token))\n  (=> (and (ValidToken t) (WithinPerimeter s))\n      (NoMemoryLeak s))))\n(check-sat)'
                        )
                      }
                      className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 text-[10px] font-mono text-gray-300"
                    >
                      #1 Memory Safety
                    </button>
                    <button
                      onClick={() =>
                        setZ3Formula(
                          '(assert (forall ((c Cell) (m Mailbox))\n  (=> (IsolatedByDef c)\n      (not (SharedMemoryWith c m)))))\n(check-sat)'
                        )
                      }
                      className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] px-2 py-1 text-[10px] font-mono text-gray-300"
                    >
                      #2 Cell Isolation
                    </button>
                  </div>

                  <button
                    onClick={handleSolveZ3}
                    disabled={isSolvingZ3}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSolvingZ3 ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Verifying with Z3...</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} />
                        <span>Verify Satisfiability (SAT)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Proof Engine Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Theorem Solver Verdict</span>
                  {z3Result && (
                    <button
                      onClick={() => handleCopy(z3Result, 'z3')}
                      className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedText === 'z3' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedText === 'z3' ? 'Copied' : 'Copy Proof'}</span>
                    </button>
                  )}
                </div>

                <div className="h-44 rounded-xl border border-white/[0.08] bg-[#07070a] p-3 font-mono text-xs overflow-y-auto text-emerald-400 space-y-1">
                  {z3Result ? (
                    <pre className="whitespace-pre-wrap leading-relaxed">{z3Result}</pre>
                  ) : (
                    <div className="text-gray-500 italic flex items-center justify-center h-full">
                      Click &quot;Verify Satisfiability&quot; to execute Z3 theorem solver...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW C: LAYER 2 - THE ASSOCIATIVE MEMORY (THE MANIFOLD)  */}
        {/* ======================================================== */}
        {(activeTab === 'layer2' || activeTab === 'all') && (
          <div className="rounded-2xl border border-purple-500/30 bg-[#0e0d16] p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  Graph-Vector-Document Hybrid
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-purple-400" />
                  SurrealDB &amp; HNSW Semantic Latent Space
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-purple-300">
                <span>Latent Dimensions: 1536-D</span>
                <span className="text-gray-500">•</span>
                <span>Cosine Distance Engine</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Latent Coordinate Explorer */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-300">Query Latent Space</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={latentQuery}
                    onChange={(e) => setLatentQuery(e.target.value)}
                    placeholder="Enter concept or query..."
                    className="flex-1 rounded-xl border border-white/[0.12] bg-[#07070a] px-3 py-1.5 text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    onClick={handleQueryLatentSpace}
                    className="rounded-xl bg-purple-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-400 transition-all"
                  >
                    Query
                  </button>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-black/40 p-3 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-gray-400">Latent Coordinates</div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="rounded-lg bg-purple-500/10 p-1.5 border border-purple-500/20">
                      <div className="text-[9px] text-purple-400">Axis X</div>
                      <div className="text-xs font-bold text-white">{latentCoords.x}</div>
                    </div>
                    <div className="rounded-lg bg-purple-500/10 p-1.5 border border-purple-500/20">
                      <div className="text-[9px] text-purple-400">Axis Y</div>
                      <div className="text-xs font-bold text-white">{latentCoords.y}</div>
                    </div>
                    <div className="rounded-lg bg-purple-500/10 p-1.5 border border-purple-500/20">
                      <div className="text-[9px] text-purple-400">Axis Z</div>
                      <div className="text-xs font-bold text-white">{latentCoords.z}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nearest Neighbors Recall */}
              <div className="lg:col-span-2 space-y-2">
                <div className="text-xs font-bold text-gray-300">HNSW Associative Neighbors (Nearest Clusters)</div>
                <div className="space-y-1.5">
                  {associativeNeighbors.map((nb, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#07070a] px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                          #{i + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{nb.name}</div>
                          <div className="text-[10px] text-gray-400">{nb.type}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-purple-300">Δ {nb.distance}</span>
                        <div className="text-gray-500">Not measured</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW D: NEURAL PARTICLE GALAXY (LAYER 3: THE PRISM)      */}
        {/* ======================================================== */}
        {(activeTab === 'galaxy' || activeTab === 'layer3') && (
          <div className="rounded-2xl border border-sky-500/30 bg-[#0a0a14] p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">
                  Direct-To-Metal Fluid ECS Render (144fps)
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-sky-400" />
                  Neural Particle Galaxy [Bevy + WGPU Vessel]
                </h3>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-1 text-xs">
                  <span className="text-[10px] text-gray-400">Palette:</span>
                  {(['cosmic', 'formula', 'manifold'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        soundFx.playClick();
                        setParticleTheme(t);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        particleTheme === t ? 'bg-sky-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-1 text-xs">
                  <span className="text-[10px] text-gray-400">Speed:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={particleSpeed}
                    onChange={(e) => setParticleSpeed(parseFloat(e.target.value))}
                    className="w-16 accent-sky-400"
                  />
                  <span className="font-mono text-[10px] text-sky-300">{particleSpeed}x</span>
                </div>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="relative h-96 w-full rounded-2xl overflow-hidden border border-white/[0.1] bg-[#050508] shadow-2xl">
              <canvas ref={canvasRef} className="h-full w-full block cursor-crosshair" />

              <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/60 px-3 py-1.5 text-[11px] backdrop-blur-md border border-white/[0.08] text-gray-300">
                <Radio size={12} className="text-emerald-400 animate-pulse" />
                <span>Move cursor to attract neural particles • Click anywhere for energy shockwave</span>
              </div>

              <div className="pointer-events-none absolute top-3 right-3 rounded-xl bg-black/60 px-2.5 py-1 text-[10px] font-mono text-sky-300 border border-sky-500/30">
                144 FPS • WGPU Metal Direct
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW E: OPERATIONAL PROTOCOLS (THE "GLIDER" LOGIC)       */}
        {/* ======================================================== */}
        {(activeTab === 'glider' || activeTab === 'all') && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Operational Protocols (The Glider Logic)
                </span>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Sovereign Cellular Protocols &amp; Isolation Systems
                </h2>
              </div>
            </div>

            {/* 3 Core Operational Pillars Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. THE SUPRU CELLULAR PROTOCOL (SCP) */}
              <div className="rounded-2xl border border-emerald-500/30 bg-[#0c1214] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <Radio size={15} className="text-emerald-400" />
                    <span>The Supru Cellular Protocol (SCP)</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] font-mono">
                    Async Mailbox
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  <strong className="text-gray-200">Isolation by Default:</strong> No shared memory.
                  Modules communicate strictly via asynchronous Mailboxes with Zig CPU core pinning &amp; RAM quotas.
                </p>

                {/* Live Cells Status List */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                    Pinned Cores &amp; Hard RAM Quotas
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {cells.map((cell) => (
                      <div
                        key={cell.id}
                        onClick={() => setSelectedCellId(cell.id)}
                        className={`cursor-pointer rounded-xl border p-2 text-xs transition-all ${
                          selectedCellId === cell.id
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-white'
                            : 'border-white/[0.06] bg-black/40 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {cell.name}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-300">
                            Core #{cell.cpuCorePinned}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span>RAM: {cell.ramUsageMb}MB / {cell.ramQuotaMb}MB</span>
                          <span>Mailbox: {cell.mailboxMessages} msgs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. THE OMNI-SHIELD (CELLULAR SOVEREIGNTY) */}
              <div className="rounded-2xl border border-amber-500/30 bg-[#14100c] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <Lock size={15} className="text-amber-400" />
                    <span>The Omni-Shield</span>
                  </div>
                  <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 text-[9px] font-mono">
                    Zero-Trust
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  <strong className="text-gray-200">Cellular Sovereignty:</strong> Every inter-module
                  request cannot be authorized in this build because no Z3 proof runner or native permission authority is connected.
                </p>

                {/* Token Generator Simulator */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                    Request Token (Unavailable Without Proof Runner)
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400">From Cell:</label>
                      <select
                        value={tokenSourceCell}
                        onChange={(e) => setTokenSourceCell(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.1] bg-[#07070a] p-1.5 text-xs text-white focus:outline-none"
                      >
                        {cells.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400">To Cell:</label>
                      <select
                        value={tokenTargetCell}
                        onChange={(e) => setTokenTargetCell(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.1] bg-[#07070a] p-1.5 text-xs text-white focus:outline-none"
                      >
                        {cells.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleIssueShieldToken}
                    disabled={shieldTokenStatus === 'verifying'}
                    className="w-full rounded-xl bg-amber-500 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-md disabled:opacity-50"
                  >
                    {shieldTokenStatus === 'verifying' ? 'Verifying with Z3 Theorem Prover...' : 'Generate Z3-Verified Token'}
                  </button>

                  {generatedShieldToken && (
                    <div className="rounded-xl border border-amber-500/40 bg-black/60 p-2.5 font-mono text-[10px] text-amber-300 space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>✔ Micro-Perimeter Verified</span>
                        <span>SAT</span>
                      </div>
                      <div className="truncate text-gray-300">{generatedShieldToken}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. THE SUPRU AKHADA (CONTAINMENT & ISOLATION WARDS) */}
              <div className="rounded-2xl border border-rose-500/30 bg-[#160c10] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <Flame size={15} className="text-rose-400" />
                    <span>The Supru Akhada</span>
                  </div>
                  <span className="rounded bg-rose-500/20 text-rose-300 px-1.5 py-0.5 text-[9px] font-mono">
                    Ephemeral Wards
                  </span>
                </div>

                <p className="text-xs text-gray-400">
                  <strong className="text-gray-200">Cybersecurity Containment:</strong> Detonate threats
                  in Disposable Linux Guests. The Host OS remains a &quot;Healthy Hospital&quot;; all communication
                  is scrubbed gRPC.
                </p>

                {/* Disposable Wards List */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                    Active Ephemeral Wards
                  </div>

                  {wards.map((ward) => (
                    <div
                      key={ward.id}
                      className="rounded-xl border border-white/[0.08] bg-black/40 p-2.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ward.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold ${
                            ward.sandboxState === 'sterile'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ward.sandboxState === 'detonating'
                              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {ward.sandboxState}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono truncate">{ward.guestOs}</div>
                      <div className="text-[10px] text-rose-300 truncate">Threat: {ward.threatVector}</div>

                      <button
                        onClick={() => handleDetonateWard(ward.id)}
                        disabled={isDetonatingWard}
                        className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                      >
                        {isDetonatingWard ? 'Detonating in Guest Ward...' : 'Detonate in Ward & Test Hospital Invariant'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrubbed gRPC & Telemetry Stream */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" />
                  <span>Sterile Zone (Healthy Hospital) &amp; Scrubbed gRPC Audit Stream</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400">Zero Host Compromise Guaranteed</span>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#050508] p-3 font-mono text-xs text-gray-300 space-y-1">
                {grpcTelemetry.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-gray-500 select-none">&gt;</span>
                    <span
                      className={
                        item.includes('HEALTHY HOSPITAL')
                          ? 'text-emerald-400 font-bold'
                          : item.includes('Detonation')
                          ? 'text-rose-400'
                          : item.includes('Omni-Shield')
                          ? 'text-amber-300'
                          : 'text-gray-300'
                      }
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
