import React, { useState, useRef, useEffect, useMemo } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { 
  Code2, 
  Play, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  X, 
  FileCode, 
  RefreshCw,
  Terminal,
  Columns2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RotateCcw,
  Eye,
  Trash2,
  AppWindow,
  HelpCircle,
  Laptop,
  Mic,
  MicOff,
  MessageSquare,
  Bot,
  ArrowDown
} from 'lucide-react';
import { 
  EditorFile, 
  SupportedLanguage, 
  CodingSpaceLayout, 
  LocalHostConfig,
  ExternalAIModelConfig,
  StudioModelSettings,
  ConsoleLogEntry,
  StudioWindowId,
  StudioWindowState
} from '../../types/workbench';
import { ConnectExternalModelModal } from '../modals/ConnectExternalModelModal';
import { GetCodeModal } from '../modals/GetCodeModal';
import { FloatingWindow } from './FloatingWindow';
import { soundFx } from '../../utils/audio';
import { useSpeechListener } from '../../utils/useSpeechListener';

interface CodeEditorViewProps {
  onRunInTerminal: (command: string) => void;
  onSendToChat: (codePrompt: string) => void;
  codingLayout?: CodingSpaceLayout;
  onChangeCodingLayout?: (layout: CodingSpaceLayout) => void;
  localConfig: LocalHostConfig;
  onOpenLocalSettings: () => void;
  onTriggerAgent: (objective: string) => void;
  activeFileBuffer?: { name: string; content: string } | null;
  // Window management props
  windows?: Record<StudioWindowId, StudioWindowState>;
  onToggleWindow?: (id: StudioWindowId) => void;
  onToggleUndockWindow?: (id: StudioWindowId) => void;
  onDockAllWindows?: () => void;
  onResetWindowLayout?: () => void;
  onOpenConnectModel?: () => void;
  onOpenGetCode?: () => void;
  onOpenAddModels?: () => void;
  activeModelName?: string;
  activeCustomModel?: ExternalAIModelConfig | null;
  externalPrompt?: { id: string; text: string } | null;
  onClearExternalPrompt?: () => void;

}

function resolveNativeModelConfig(
  localConfig: LocalHostConfig,
  activeCustomModel?: ExternalAIModelConfig | null,
): { provider: string; endpointUrl: string; modelName: string; apiKey: string | null } {
  const providerMap: Record<string, string> = {
    gemini_cloud: 'gemini_cloud',
    gemini: 'gemini',
    openai: 'openai',
    anthropic: 'anthropic',
    deepseek: 'deepseek',
    groq: 'groq',
    ollama: 'ollama_local',
    ollama_local: 'ollama_local',
    lmstudio: 'lmstudio_local',
    lmstudio_local: 'lmstudio_local',
    custom: 'custom_local',
    custom_local: 'custom_local',
    offline_core: 'offline_core',
  };
  const defaults: Record<string, string> = {
    gemini_cloud: 'https://generativelanguage.googleapis.com',
    gemini: 'https://generativelanguage.googleapis.com',
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    groq: 'https://api.groq.com/openai/v1',
    ollama: 'http://127.0.0.1:11434',
    ollama_local: 'http://127.0.0.1:11434',
    lmstudio: 'http://127.0.0.1:1234/v1',
    lmstudio_local: 'http://127.0.0.1:1234/v1',
  };

  if (activeCustomModel) {
    const provider = providerMap[activeCustomModel.provider] || activeCustomModel.provider;
    const endpointUrl = activeCustomModel.endpointUrl || (
      activeCustomModel.provider === 'custom'
        ? ''
        : defaults[activeCustomModel.provider] || localConfig.endpointUrl
    );
    if (provider === 'custom_local' && !endpointUrl.trim()) {
      throw new Error('Add the custom provider base URL before using Code Copilot.');
    }
    return {
      provider,
      endpointUrl,
      modelName: activeCustomModel.modelId,
      apiKey: activeCustomModel.apiKey || localConfig.apiKey || null,
    };
  }

  return {
    provider: providerMap[localConfig.provider] || localConfig.provider,
    endpointUrl: localConfig.endpointUrl || defaults[localConfig.provider] || '',
    modelName: localConfig.modelName,
    apiKey: localConfig.apiKey || null,
  };
}

function extractGeneratedCode(responseText: string): string | null {
  const fenceStart = responseText.indexOf('```');
  if (fenceStart >= 0) {
    const lineEnd = responseText.indexOf('\n', fenceStart + 3);
    if (lineEnd >= 0) {
      const fenceEnd = responseText.indexOf('```', lineEnd + 1);
      if (fenceEnd > lineEnd) {
        const code = responseText.slice(lineEnd + 1, fenceEnd).trim();
        if (code) return code;
      }
    }
  }
  const trimmed = responseText.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('<!doctype html') || lower.startsWith('<html') || trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
    return trimmed;
  }
  return null;
}

// Preset interactive showcase applications for instant 1-click loading
const PRESET_TEMPLATES: { name: string; icon: string; desc: string; file: EditorFile }[] = [
  {
    name: 'Neural Particle Galaxy',
    icon: '🌌',
    desc: 'Interactive 60FPS canvas galaxy with mouse gravity & shockwaves',
    file: {
      id: 'tpl-galaxy',
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supru Neural Galaxy</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; background: #08080f; overflow: hidden; font-family: system-ui, sans-serif; }
    canvas { display: block; }
    .glass { background: rgba(18, 18, 28, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(251, 191, 36, 0.25); }
  </style>
</head>
<body class="relative h-screen w-screen select-none">
  <!-- Interactive Floating HUD -->
  <div class="absolute top-4 left-4 z-10 glass rounded-2xl p-4 text-white shadow-2xl max-w-xs transition-all">
    <div class="flex items-center gap-2 mb-2">
      <span class="flex h-3 w-3 rounded-full bg-amber-400 animate-ping"></span>
      <h1 class="text-xs font-bold tracking-wider text-amber-300">SUPRU NEURAL GALAXY</h1>
    </div>
    <p class="text-[11px] text-gray-300 mb-3 leading-relaxed">
      Move cursor to attract neural particles. Click anywhere to trigger a hyper-energy shockwave!
    </p>
    <div class="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-800 pt-2">
      <span>Nodes: <strong id="nodeCount" class="text-amber-400">180</strong></span>
      <span>Speed: <strong class="text-emerald-400">60 FPS</strong></span>
      <button id="toggleColor" class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[9.5px] font-bold">
        Morph Palette
      </button>
    </div>
  </div>

  <canvas id="galaxyCanvas"></canvas>

  <script>
    const canvas = document.getElementById('galaxyCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const mouse = { x: width / 2, y: height / 2 };
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    });

    let paletteIndex = 0;
    const palettes = [
      ['#f59e0b', '#fbbf24', '#d97706', '#ef4444', '#8b5cf6'],
      ['#06b6d4', '#3b82f6', '#6366f1', '#ec4899', '#10b981'],
      ['#10b981', '#34d399', '#059669', '#f59e0b', '#3b82f6'],
    ];

    document.getElementById('toggleColor').addEventListener('click', () => {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      particles.forEach(p => p.color = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)]);
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2.5 + 1;
        this.baseRadius = this.radius;
        this.color = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)];
      }
      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          const force = (180 - dist) / 180;
          this.vx += (dx / dist) * force * 0.45;
          this.vy += (dy / dist) * force * 0.45;
          this.radius = this.baseRadius * (1 + force * 1.5);
        } else {
          this.radius = this.baseRadius;
        }
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles = Array.from({ length: 180 }, () => new Particle());

    window.addEventListener('click', (e) => {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1.5,
          color: '#ffffff',
          update() {
            this.x += this.vx; this.y += this.vy;
            this.vx *= 0.92; this.vy *= 0.92;
            this.radius *= 0.95;
          },
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.2, this.radius), 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        });
      }
    });

    function loop() {
      ctx.fillStyle = 'rgba(8, 8, 15, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Connect nearby particles with subtle laser filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.beginPath();
            ctx.strokeStyle = \`rgba(245, 158, 11, \${(85 - dist) / 85 * 0.25})\`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.radius < 0.3) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    loop();
    console.log('🌌 Supru Neural Galaxy initialized with 60FPS physics loop.');
  </script>
</body>
</html>`
    }
  },
  {
    name: 'Web Audio Synthesizer',
    icon: '🎛️',
    desc: 'Real Web Audio API synthesizer with live frequency spectrum visualizer',
    file: {
      id: 'tpl-synth',
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supru Audio Synth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex flex-col items-center justify-center min-h-screen bg-[#09090f] text-gray-100 p-6 select-none font-mono">
  <div class="w-full max-w-lg bg-[#13131c] border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-xl">🐾</span>
        <h1 class="text-sm font-bold text-amber-400">SUPRU SYNTHESIZER</h1>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
        Web Audio API
      </span>
    </div>

    <!-- Visualizer Canvas -->
    <canvas id="visualizer" width="450" height="120" class="w-full bg-[#090912] rounded-xl border border-gray-800 mb-5"></canvas>

    <!-- Keypad -->
    <div class="grid grid-cols-7 gap-2 mb-4">
      <button onclick="playTone(261.63, 'C4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">C4</button>
      <button onclick="playTone(293.66, 'D4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">D4</button>
      <button onclick="playTone(329.63, 'E4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">E4</button>
      <button onclick="playTone(349.23, 'F4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">F4</button>
      <button onclick="playTone(392.00, 'G4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">G4</button>
      <button onclick="playTone(440.00, 'A4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">A4</button>
      <button onclick="playTone(493.88, 'B4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">B4</button>
    </div>

    <p class="text-[11px] text-gray-400 text-center">
      Click keys to trigger harmonic synthesizer frequencies & live oscilloscope waveform.
    </p>
  </div>

  <script>
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        renderVisualizer();
        console.log('AudioContext activated.');
      }
    }

    function playTone(freq, note) {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      console.log('Played note:', note, freq + 'Hz');
    }

    function renderVisualizer() {
      requestAnimationFrame(renderVisualizer);
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#090912';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        ctx.fillStyle = \`hsl(\${i * 8 + 35}, 100%, 55%)\`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
  </script>
</body>
</html>`
    }
  }
];

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  onRunInTerminal,
  onSendToChat,
  localConfig,
  onOpenLocalSettings,
  onTriggerAgent,
  activeFileBuffer,
  windows = {
    editor: { id: 'editor', title: 'Code Editor', isOpen: true, isUndocked: false },
    preview: { id: 'preview', title: 'Live Preview Sandbox', isOpen: true, isUndocked: false },
    generator: { id: 'generator', title: 'AI Code Generator', isOpen: true, isUndocked: false },
    terminal: { id: 'terminal', title: 'Terminal / CLI', isOpen: false, isUndocked: false },
    agent: { id: 'agent', title: 'Supru Hunter Agent', isOpen: false, isUndocked: false },
    github: { id: 'github', title: 'GitHub Workspace', isOpen: false, isUndocked: false },
    console: { id: 'console', title: 'Interactive Console', isOpen: false, isUndocked: false },
  },
  onToggleWindow,
  onToggleUndockWindow,
  onDockAllWindows,
  onResetWindowLayout,
  onOpenConnectModel,
  onOpenGetCode,
  onOpenAddModels,
  activeModelName,
  activeCustomModel,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  // Robust continuous speech listener for code generator
  const {
    isListening: isVoiceListening,
    interimText: voiceInterimText,
    audioVolume: voiceVolume,
    voiceNotice: voiceNoticeMsg,
    setVoiceNotice: setVoiceNoticeMsg,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
  } = useSpeechListener();

  // Supru Code AI Copilot Chat state
  const [activeAiTab, setActiveAiTab] = useState<'copilot' | 'synthesizer'>('copilot');
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    codeSnippet?: string;
    timestamp: number;
  }>>([
    {
      id: 'copilot-init',
      role: 'assistant',
      text: "👋 **Supru Code Copilot** is active.\n\nI have real-time context of **index.html**. Ask questions about your code, request features, or tell me to inspect, refactor, or fix bugs! (All chats stay right here inside Supru Code).",
      timestamp: Date.now(),
    }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const copilotScrollRef = useRef<HTMLDivElement>(null);

  // Files in the editor
  const [files, setFiles] = useState<EditorFile[]>([
    PRESET_TEMPLATES[0].file,
    {
      id: 'f-pipe',
      name: 'supru_pipeline.ts',
      language: 'typescript',
      content: `// 🐾 Supru Code - Enterprise Architecture Pipeline
export interface AgentTask {
  id: string;
  objective: string;
  status: 'idle' | 'running' | 'completed';
  confidence: number;
}

export class SupruPipeline {
  private persona: string = 'supru_cat';

  constructor(private readonly endpoint: string = 'http://localhost:11434') {}

  public async evaluateObjective(task: AgentTask): Promise<string> {
    console.log(\`[Supru Code] Synthesizing: \${task.objective}\`);
    return \`Autonomous delivery pipeline synthesized for: \${task.id}\`;
  }
}
`,
    }
  ]);
  const [activeFileId, setActiveFileId] = useState<string>(files[0].id);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Split Ratio between Code Editor (left) and Live Preview (right)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('supru_editor_split_ratio');
      if (saved) return parseFloat(saved);
    } catch {}
    return 50;
  });

  // Drawer Height for Bottom Generator / Console Drawer
  const [drawerHeight, setDrawerHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('supru_drawer_height');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 180;
  });

  // Save split ratio and drawer height to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('supru_editor_split_ratio', String(splitRatio));
    } catch {}
  }, [splitRatio]);

  useEffect(() => {
    try {
      localStorage.setItem('supru_drawer_height', String(drawerHeight));
    } catch {}
  }, [drawerHeight]);

  // Preview device viewport simulation
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'preview' | 'console'>('preview');

  // Preview Execution State
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isAutoRun, setIsAutoRun] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([
    { id: '1', level: 'info', message: '🐾 Supru Live Preview Sandbox initialized. Ready to execute.', timestamp: Date.now() }
  ]);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Generator Drawer State ("Generate by Message")
  const [generatorPrompt, setGeneratorPrompt] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<string | null>(null);
  const [showDirectivesDropdown, setShowDirectivesDropdown] = useState(false);
  const directivesRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // If a file was sent from GitHub or CLI
  useEffect(() => {
    if (activeFileBuffer) {
      const existing = files.find((f) => f.name === activeFileBuffer.name);
      if (existing) {
        setActiveFileId(existing.id);
      } else {
        const ext = activeFileBuffer.name.split('.').pop() || 'html';
        const lang = ext === 'html' ? 'html' : ext === 'ts' ? 'typescript' : ext === 'js' ? 'javascript' : ext === 'py' ? 'python' : 'html';
        const newFile: EditorFile = {
          id: `file-imported-${Date.now()}`,
          name: activeFileBuffer.name,
          language: lang,
          content: activeFileBuffer.content,
        };
        setFiles((prev) => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
    }
  }, [activeFileBuffer]);

  // Click outside listener for directives dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (directivesRef.current && !directivesRef.current.contains(e.target as Node)) {
        setShowDirectivesDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for console logs & runtime errors from inside the sandbox iframe
  useEffect(() => {
    function handleIframeMessage(e: MessageEvent) {
      if (e.data && e.data.source === 'supru-sandbox') {
        if (e.data.type === 'log') {
          setConsoleLogs((prev) => [
            ...prev.slice(-99),
            {
              id: `log-${Date.now()}-${Math.random()}`,
              level: e.data.level || 'log',
              message: String(e.data.message),
              timestamp: Date.now(),
            }
          ]);
        } else if (e.data.type === 'error') {
          setRuntimeError(e.data.message);
          setConsoleLogs((prev) => [
            ...prev.slice(-99),
            {
              id: `err-${Date.now()}`,
              level: 'error',
              message: `Error: ${e.data.message}`,
              timestamp: Date.now(),
            }
          ]);
        }
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Auto-run debounce when file content changes
  useEffect(() => {
    if (!isAutoRun) return;
    const timer = setTimeout(() => {
      setRuntimeError(null);
      setIframeKey(Date.now());
    }, 450);
    return () => clearTimeout(timer);
  }, [activeFile.content, isAutoRun]);

  const handleUpdateContent = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, content: newContent, isModified: true } : f
      )
    );
  };

  const handleCreateFile = () => {
    soundFx.playClick();
    const newId = `f-${Date.now()}`;
    const newFile: EditorFile = {
      id: newId,
      name: `app_${files.length + 1}.html`,
      language: 'html',
      content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
  <div class="text-center p-6 border border-amber-500/30 rounded-2xl bg-slate-900 shadow-xl">
    <h1 class="text-xl font-bold text-amber-400">🐾 New Web Applet</h1>
    <p class="text-xs text-gray-400 mt-2">Start coding or generate by message!</p>
  </div>
</body>
</html>`,
      isModified: true,
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const handleCloseFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (activeFileId === id) {
      setActiveFileId(remaining[0].id);
    }
  };

  const handleManualRunPreview = () => {
    soundFx.playClick();
    setRuntimeError(null);
    setIframeKey(Date.now());
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    link.click();
    URL.revokeObjectURL(url);
    soundFx.playChime();
  };

  // Listen for 'supru-format-code' event from StudioHeader
  useEffect(() => {
    const handleFormat = () => {
      soundFx.playClick();
      const formatted = activeFile.content
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n');
      handleUpdateContent(formatted);
      setGenerationSummary('Code formatted and standardized.');
    };
    window.addEventListener('supru-format-code', handleFormat);
    return () => window.removeEventListener('supru-format-code', handleFormat);
  }, [activeFile.content]);

  // Google AI Studio: Generate or Refine Code by Message
  const handleGenerateByMessage = async (presetPrompt?: string) => {
    const promptToSend = presetPrompt || generatorPrompt.trim();
    if (!promptToSend || isGeneratingCode) return;

    if (isVoiceListening) {
      stopVoiceListening();
    }

    soundFx.playClick();
    setIsGeneratingCode(true);
    setGenerationSummary(null);

    const modelConfigPayload = activeCustomModel
      ? {
          provider: activeCustomModel.provider,
          modelId: activeCustomModel.modelId,
          apiKey: activeCustomModel.apiKey,
          endpointUrl: activeCustomModel.endpointUrl,
        }
      : localConfig && localConfig.provider !== 'gemini_cloud'
      ? {
          provider: localConfig.provider,
          modelId: localConfig.modelName,
          endpointUrl: localConfig.endpointUrl,
        }
      : {
          provider: 'gemini',
          modelId: 'gemini-3.8-flash',
        };

    try {
      let data: { code?: string; explanation?: string; error?: string };
      if (isTauri()) {
        const nativeModel = resolveNativeModelConfig(localConfig, activeCustomModel);
        const responseText = await invoke<string>('chat_completion', {
          provider: nativeModel.provider,
          endpointUrl: nativeModel.endpointUrl,
          modelName: nativeModel.modelName,
          apiKey: nativeModel.apiKey,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are Supru Code's app builder. Apply the user's requested changes to the current ${activeFile.language} file. Return the COMPLETE updated file inside one fenced code block, then give a short explanation. Do not claim changes were applied; the UI will apply the returned code only after receiving it. Current file: ${activeFile.name}.\n\nCurrent source:\n```${activeFile.language}\n${activeFile.content}\n````,
            },
            { role: 'user', content: promptToSend },
          ],
        });
        const code = extractGeneratedCode(responseText);
        data = code
          ? { code, explanation: `Received updated code from ${nativeModel.modelName}.` }
          : { explanation: responseText };
      } else {
        const res = await fetch('/api/studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptToSend,
            currentCode: activeFile.content,
            language: activeFile.language,
            modelConfig: modelConfigPayload,
          }),
        });
        data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Generation failed (HTTP ${res.status})`);
      }

      if (data.code) {
        handleUpdateContent(data.code);
        setGenerationSummary(data.explanation || `Code updated by ${modelConfigPayload.modelId || 'the selected AI model'}.`);
        setIframeKey(Date.now());
        soundFx.playChime();
        if (!presetPrompt) setGeneratorPrompt('');
      } else {
        setGenerationSummary(data.explanation
          ? `No code was applied. The model did not return a complete code block.\n\n${data.explanation}`
          : 'No code was returned; the current file was left unchanged.');
      }
    } catch (err: any) {
      setGenerationSummary(`Generation error: ${err.message}. The current file was left unchanged.`);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // One-click Fix Error with AI
  const handleFixErrorWithAI = () => {
    if (!runtimeError) return;
    const fixPrompt = `Fix the following runtime error in ${activeFile.name}:\nError: ${runtimeError}\nEnsure no undefined variables, invalid DOM calls, or syntax mistakes exist.`;
    setActiveAiTab('copilot');
    handleSendCopilotMessage(fixPrompt);
  };

  // Listen for incoming external prompt from FloatingChatPill or other actions
  useEffect(() => {
    if (externalPrompt && externalPrompt.text && externalPrompt.text.trim()) {
      if (!windows.generator?.isOpen) {
        onToggleWindow?.('generator');
      }
      if (drawerHeight < 280) {
        setDrawerHeight(340);
      }
      setActiveAiTab('copilot');
      handleSendCopilotMessage(externalPrompt.text.trim());
      onClearExternalPrompt?.();
    }
  }, [externalPrompt]);

  // Auto-scroll Copilot messages to bottom
  useEffect(() => {
    if (activeAiTab === 'copilot' && copilotScrollRef.current) {
      copilotScrollRef.current.scrollTop = copilotScrollRef.current.scrollHeight;
    }
  }, [copilotMessages, activeAiTab]);

  // Handle sending a chat message to Supru Code Copilot (Stays inside Supru Code!)
  const handleSendCopilotMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || copilotInput.trim();
    if (!textToSend || isCopilotThinking) return;

    if (isVoiceListening) {
      stopVoiceListening();
    }

    soundFx.playClick();
    const userMsgId = `user-${Date.now()}`;
    const newUserMsg = {
      id: userMsgId,
      role: 'user' as const,
      text: textToSend,
      timestamp: Date.now(),
    };

    const nextMessages = [...copilotMessages, newUserMsg];
    setCopilotMessages(nextMessages);
    if (!customPrompt) setCopilotInput('');
    setIsCopilotThinking(true);

    const modelConfigPayload = activeCustomModel
      ? {
          provider: activeCustomModel.provider,
          modelId: activeCustomModel.modelId,
          apiKey: activeCustomModel.apiKey,
          endpointUrl: activeCustomModel.endpointUrl,
        }
      : localConfig && localConfig.provider !== 'gemini_cloud'
      ? {
          provider: localConfig.provider,
          modelId: localConfig.modelName,
          endpointUrl: localConfig.endpointUrl,
        }
      : {
          provider: 'gemini',
          modelId: 'gemini-3.8-flash',
        };

    try {
      const res = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.text })),
          currentCode: activeFile.content,
          fileName: activeFile.name,
          language: activeFile.language,
          modelConfig: modelConfigPayload,
        }),
      });

      const data = await res.json();
      const asstMsgId = `asst-${Date.now()}`;
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: asstMsgId,
          role: 'assistant',
          text: data.reply || 'Analysis completed.',
          codeSnippet: data.code || undefined,
          timestamp: Date.now(),
        },
      ]);
      soundFx.playChime();
    } catch (err: any) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Notice:** ${err.message}.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsCopilotThinking(false);
    }
  };

  // 1-Click apply generated code snippet directly to active file in editor
  const handleApplySnippet = (snippet: string) => {
    handleUpdateContent(snippet);
    setIframeKey(Date.now());
    soundFx.playChime();
    setAppliedNotice(`Applied code update directly to ${activeFile.name}!`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  // Copy code snippet to clipboard
  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    soundFx.playClick();
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Generate sandboxed HTML with injected console logger
  const sandboxHtml = useMemo(() => {
    if (activeFile.language !== 'html') {
      return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { background: #0b0b12; color: #f1f2f6; font-family: monospace; padding: 24px; }</style>
</head>
<body>
  <div class="max-w-xl mx-auto border border-gray-800 rounded-xl bg-[#12121a] p-5 shadow-xl">
    <div class="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase">
      <span>📄</span>
      <span>${activeFile.name} (${activeFile.language.toUpperCase()})</span>
    </div>
    <p class="text-xs text-gray-400 mb-4">
      Non-HTML file active. You can run it via Supru CLI or switch to an HTML file to see real-time UI previews.
    </p>
    <pre class="bg-black/60 p-4 rounded-lg text-xs text-amber-200 overflow-x-auto whitespace-pre leading-relaxed">${activeFile.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>`;
    }

    const interceptor = `
      <script>
        (function() {
          const sendLog = (level, args) => {
            try {
              const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
              window.parent.postMessage({ source: 'supru-sandbox', type: 'log', level, message: msg }, '*');
            } catch(e) {}
          };
          const origLog = console.log;
          const origInfo = console.info;
          const origWarn = console.warn;
          const origError = console.error;
          console.log = (...args) => { origLog(...args); sendLog('log', args); };
          console.info = (...args) => { origInfo(...args); sendLog('info', args); };
          console.warn = (...args) => { origWarn(...args); sendLog('warn', args); };
          console.error = (...args) => { origError(...args); sendLog('error', args); };
          window.onerror = function(msg, url, line) {
            window.parent.postMessage({ source: 'supru-sandbox', type: 'error', message: msg + ' (Line ' + line + ')' }, '*');
            return false;
          };
        })();
      </script>
    `;

    return activeFile.content.includes('<head>')
      ? activeFile.content.replace('<head>', `<head>${interceptor}`)
      : `${interceptor}${activeFile.content}`;
  }, [activeFile.content, activeFile.language, activeFile.name]);

  const lines = activeFile.content.split('\n');

  // ==========================================================
  // DRAGGABLE HORIZONTAL SPLITTER (Between Editor & Preview)
  // ==========================================================
  const isDraggingHorizontalRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStartHorizontalResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingHorizontalRef.current = true;

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDraggingHorizontalRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const newRatio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(15, Math.min(85, newRatio)));
    };

    const handleStop = () => {
      isDraggingHorizontalRef.current = false;
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

  // ==========================================================
  // DRAGGABLE VERTICAL SPLITTER (Above Bottom Drawer)
  // ==========================================================
  const isDraggingVerticalRef = useRef(false);

  const handleStartVerticalResize = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingVerticalRef.current = true;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startH = drawerHeight;

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDraggingVerticalRef.current) return;
      const currentY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const deltaY = startY - currentY;
      setDrawerHeight(Math.max(80, Math.min(550, startH + deltaY)));
    };

    const handleStop = () => {
      isDraggingVerticalRef.current = false;
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

  // Determine which windows are docked vs open
  const isEditorOpen = windows.editor?.isOpen ?? true;
  const isEditorDocked = !(windows.editor?.isUndocked ?? false);

  const isPreviewOpen = windows.preview?.isOpen ?? true;
  const isPreviewDocked = !(windows.preview?.isUndocked ?? false);

  const isGeneratorOpen = windows.generator?.isOpen ?? true;
  const isGeneratorDocked = !(windows.generator?.isUndocked ?? false);

  // Both editor and preview docked side by side
  const showSplitPanes = isEditorOpen && isEditorDocked && isPreviewOpen && isPreviewDocked;
  const showOnlyEditorDocked = isEditorOpen && isEditorDocked && (!isPreviewOpen || !isPreviewDocked);
  const showOnlyPreviewDocked = isPreviewOpen && isPreviewDocked && (!isEditorOpen || !isEditorDocked);

  // ==========================================================
  // WINDOW BODY CONTENTS
  // ==========================================================

  // 1. CODE EDITOR WINDOW BODY
  const renderEditorContent = () => (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0c0c14]">
      {/* File Tabs & Actions Toolbar */}
      <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-[#101018] px-2 text-[11px] shrink-0">
        {/* File Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveFileId(file.id);
                }}
                className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1 cursor-pointer text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1b1b28] text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:bg-[#14141e] hover:text-gray-200'
                }`}
              >
                <FileCode size={11} className={isActive ? 'text-amber-400' : 'text-gray-500'} />
                <span>{file.name}</span>
                {file.isModified && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}

                {files.length > 1 && (
                  <button
                    onClick={(e) => handleCloseFile(file.id, e)}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-white/10 hover:text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleCreateFile}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-gray-400 hover:bg-[#1a1a24] hover:text-white transition-colors"
            title="Create new file"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Editor Controls & Window Dock/Close */}
        <div className="flex items-center gap-1">
          {/* Auto-run Toggle */}
          <button
            onClick={() => setIsAutoRun(!isAutoRun)}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${
              isAutoRun
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-white/[0.08] bg-[#141420] text-gray-500'
            }`}
            title="Toggle live execution on typing"
          >
            <Zap size={10} />
            <span className="hidden sm:inline">Auto-run</span>
          </button>

          {/* Run Preview Play Button */}
          <button
            onClick={handleManualRunPreview}
            className="flex items-center gap-1 rounded bg-emerald-500 px-2 py-0.5 text-[10.5px] font-bold text-neutral-950 hover:bg-emerald-400 transition-colors shadow-sm"
            title="Run Sandbox Preview (Ctrl+Enter)"
          >
            <Play size={10} className="fill-neutral-950" />
            <span>Run</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            title="Copy code"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>

          <button
            onClick={handleDownloadFile}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            title="Download file"
          >
            <Download size={11} />
          </button>

          <span className="h-3 w-[1px] bg-white/[0.08] mx-0.5" />

          {/* Undock / Dock Button */}
          <button
            onClick={() => onToggleUndockWindow?.('editor')}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-amber-300 transition-colors"
            title={windows.editor?.isUndocked ? 'Dock to Grid' : 'Undock (Float) Editor Window'}
          >
            <AppWindow size={12} />
          </button>

          {/* Close Window */}
          <button
            onClick={() => onToggleWindow?.('editor')}
            className="rounded p-1 text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Close Editor (Reopen from Windows menu)"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Code Textarea & Gutter */}
      <div className="relative flex flex-1 overflow-hidden bg-[#09090f]">
        {/* Line Numbers Gutter */}
        <div className="select-none bg-[#07070c] py-2.5 pl-2.5 pr-2 text-right font-mono text-[11px] text-gray-600 border-r border-white/[0.06]">
          {lines.map((_, idx) => (
            <div key={idx} className="h-5 leading-5 text-[10.5px]">
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Editor */}
        <textarea
          ref={textareaRef}
          value={activeFile.content}
          onChange={(e) => handleUpdateContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const val = activeFile.content;
              handleUpdateContent(val.substring(0, start) + '  ' + val.substring(end));
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
              }, 0);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleManualRunPreview();
            }
          }}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-2.5 font-mono text-[11.5px] leading-5 text-gray-100 outline-none selection:bg-amber-500/30 selection:text-amber-200"
          placeholder="// Write code here..."
        />
      </div>
    </div>
  );

  // 2. LIVE PREVIEW SANDBOX WINDOW BODY
  const renderPreviewContent = () => (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0a0a12]">
      {/* Sandbox Header Toolbar */}
      <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-[#101018] px-2 text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sandbox</span>
          </span>

          {/* Viewport switchers */}
          <div className="flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-[#141420] p-0.5">
            <button
              onClick={() => setDeviceViewport('desktop')}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                deviceViewport === 'desktop' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'
              }`}
              title="Desktop 100%"
            >
              <Monitor size={11} />
            </button>
            <button
              onClick={() => setDeviceViewport('tablet')}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                deviceViewport === 'tablet' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'
              }`}
              title="Tablet 768px"
            >
              <Tablet size={11} />
            </button>
            <button
              onClick={() => setDeviceViewport('mobile')}
              className={`rounded px-1.5 py-0.5 transition-colors ${
                deviceViewport === 'mobile' ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'
              }`}
              title="Mobile 375px"
            >
              <Smartphone size={11} />
            </button>
          </div>
        </div>

        {/* Right Toolbar: Tabs + Dock/Close */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-[#141420] p-0.5 text-[10px]">
            <button
              onClick={() => setPreviewTab('preview')}
              className={`rounded px-2 py-0.5 font-medium transition-colors ${
                previewTab === 'preview' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Canvas
            </button>
            <button
              onClick={() => setPreviewTab('console')}
              className={`rounded px-2 py-0.5 font-medium transition-colors flex items-center gap-1 ${
                previewTab === 'console' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Console</span>
              {consoleLogs.length > 0 && (
                <span className="rounded-full bg-gray-800 px-1 text-[9px] font-mono text-gray-300">
                  {consoleLogs.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleManualRunPreview}
            className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/10"
            title="Reload sandbox preview"
          >
            <RefreshCw size={11} />
          </button>

          <span className="h-3 w-[1px] bg-white/[0.08] mx-0.5" />

          {/* Undock / Dock Button */}
          <button
            onClick={() => onToggleUndockWindow?.('preview')}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-amber-300 transition-colors"
            title={windows.preview?.isUndocked ? 'Dock to Grid' : 'Undock (Float) Preview Window'}
          >
            <AppWindow size={12} />
          </button>

          {/* Close Window */}
          <button
            onClick={() => onToggleWindow?.('preview')}
            className="rounded p-1 text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Close Preview (Reopen from Windows menu)"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Live Sandbox Container */}
      <div className="relative flex-1 overflow-hidden bg-[#07070b] flex items-center justify-center p-1 sm:p-2">
        {previewTab === 'preview' ? (
          <div
            className={`h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/[0.08] transition-all duration-300 ${
              deviceViewport === 'desktop'
                ? 'w-full'
                : deviceViewport === 'tablet'
                ? 'w-[768px] max-w-full'
                : 'w-[375px] max-w-full'
            }`}
          >
            <iframe
              key={iframeKey}
              srcDoc={sandboxHtml}
              title="Supru Live Sandbox"
              sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
              className="h-full w-full border-none bg-black"
            />
          </div>
        ) : (
          /* Console Log View */
          <div className="h-full w-full bg-[#0a0a10] rounded-xl border border-white/[0.08] p-3 font-mono text-xs overflow-y-auto space-y-1.5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2 text-gray-400 text-[11px]">
              <span>Interactive Sandbox Console</span>
              <button
                onClick={() => setConsoleLogs([])}
                className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px]"
              >
                <Trash2 size={11} />
                <span>Clear</span>
              </button>
            </div>
            {consoleLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[10px] text-gray-600 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`text-[11px] break-all ${
                    log.level === 'error'
                      ? 'text-rose-400 font-bold'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'info'
                      ? 'text-sky-300'
                      : 'text-gray-200'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Runtime Error Overlay Banner with 1-Click AI Fix */}
        {runtimeError && (
          <div className="absolute bottom-3 left-4 right-4 rounded-xl border border-rose-500/50 bg-[#160d12]/95 backdrop-blur-md p-3 shadow-2xl flex items-center justify-between gap-3 text-xs z-30 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle size={15} className="text-rose-400 shrink-0" />
              <div>
                <strong className="font-bold">Runtime Exception:</strong>
                <span className="ml-1 text-gray-300 font-mono text-[11px]">{runtimeError}</span>
              </div>
            </div>
            <button
              onClick={handleFixErrorWithAI}
              disabled={isGeneratingCode}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1 font-bold text-neutral-950 hover:bg-amber-400 shadow-md shrink-0 text-xs disabled:opacity-50"
            >
              <Sparkles size={12} />
              <span>Fix with AI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // 3. AI COPILOT & CODE GENERATOR WINDOW BODY
  const renderGeneratorContent = () => (
    <div className="flex h-full w-full flex-col justify-between bg-[#0e0e16] p-2 space-y-2 overflow-hidden">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 px-1 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveAiTab('copilot');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              activeAiTab === 'copilot'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Chat conversation with Supru Code Copilot (Stays in IDE)"
          >
            <MessageSquare size={12} />
            <span>Copilot Chat</span>
            <span className="text-[9.5px] px-1 py-0.2 rounded bg-black/40 text-amber-200 font-mono hidden sm:inline">
              {activeFile.name}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveAiTab('synthesizer');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
              activeAiTab === 'synthesizer'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Direct prompt-to-code full-file generator"
          >
            <Zap size={12} />
            <span>Direct Synthesizer</span>
          </button>
        </div>

        {/* Action buttons & window controls */}
        <div className="flex items-center gap-1.5" ref={directivesRef}>
          {/* Directives Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowDirectivesDropdown(!showDirectivesDropdown);
              }}
              className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-[10.5px] text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              <span>Directives ▾</span>
            </button>

            {showDirectivesDropdown && (
              <div className="absolute right-0 bottom-7 w-60 rounded-xl border border-white/[0.1] bg-[#12121e]/95 p-1 shadow-2xl z-50 backdrop-blur-xl text-xs">
                <button
                  onClick={() => {
                    if (activeAiTab === 'copilot') {
                      handleSendCopilotMessage('Add fluid mouse interactive physics and particle shockwaves to this app');
                    } else {
                      handleGenerateByMessage('Add fluid mouse interactive physics and particle shockwaves to this app');
                    }
                    setShowDirectivesDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                >
                  <span>🌌</span>
                  <span>Particle Shockwaves</span>
                </button>
                <button
                  onClick={() => {
                    if (activeAiTab === 'copilot') {
                      handleSendCopilotMessage('Enhance UI with sleek dark neon cyberpunk glassmorphism theme');
                    } else {
                      handleGenerateByMessage('Enhance UI with sleek dark neon cyberpunk glassmorphism theme');
                    }
                    setShowDirectivesDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                >
                  <span>🎨</span>
                  <span>Neon Glass Theme</span>
                </button>
                <button
                  onClick={() => {
                    if (activeAiTab === 'copilot') {
                      handleSendCopilotMessage('Audit and optimize 60FPS animation loops, avoid layout thrashing');
                    } else {
                      handleGenerateByMessage('Audit and optimize 60FPS animation loops, avoid layout thrashing');
                    }
                    setShowDirectivesDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                >
                  <span>⚡</span>
                  <span>60FPS Performance</span>
                </button>
                <button
                  onClick={() => {
                    if (activeAiTab === 'copilot') {
                      handleSendCopilotMessage('Add Web Audio sound effects on click or user interaction');
                    } else {
                      handleGenerateByMessage('Add Web Audio sound effects on click or user interaction');
                    }
                    setShowDirectivesDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.08] text-gray-200"
                >
                  <span>🔊</span>
                  <span>Web Audio Sound FX</span>
                </button>
              </div>
            )}
          </div>

          {/* Undock / Dock Button */}
          <button
            onClick={() => onToggleUndockWindow?.('generator')}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-amber-300 transition-colors"
            title={windows.generator?.isUndocked ? 'Dock to Grid' : 'Undock (Float) Copilot Window'}
          >
            <AppWindow size={12} />
          </button>

          {/* Close Window */}
          <button
            onClick={() => onToggleWindow?.('generator')}
            className="rounded p-1 text-gray-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
            title="Close Copilot (Reopen from Windows menu)"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Applied Code Toast Notification */}
      {appliedNotice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-950/80 px-3 py-1.5 text-xs text-emerald-200 shadow-md animate-fadeIn shrink-0">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>{appliedNotice}</span>
          </span>
          <button onClick={() => setAppliedNotice(null)} className="text-emerald-400 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: SUPRU CODE COPILOT CHAT CONVERSATION               */}
      {/* ========================================================= */}
      {activeAiTab === 'copilot' ? (
        <div className="flex flex-1 flex-col overflow-hidden justify-between space-y-1.5">
          {/* Quick Action Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] scrollbar-none shrink-0">
            <button
              onClick={() => handleSendCopilotMessage(`Explain the code and architecture of ${activeFile.name}`)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-gray-300 hover:border-amber-400 hover:text-amber-200 transition-all shrink-0"
            >
              <span>💡 Explain Code</span>
            </button>
            <button
              onClick={() => handleSendCopilotMessage(`Find potential bugs, edge cases, and runtime exceptions in ${activeFile.name}`)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-gray-300 hover:border-amber-400 hover:text-amber-200 transition-all shrink-0"
            >
              <span>🐛 Find Bugs</span>
            </button>
            <button
              onClick={() => handleSendCopilotMessage(`Optimize animation loops and performance for smooth 60FPS in ${activeFile.name}`)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-gray-300 hover:border-amber-400 hover:text-amber-200 transition-all shrink-0"
            >
              <span>⚡ Optimize 60FPS</span>
            </button>
            <button
              onClick={() => handleSendCopilotMessage(`Add sleek dark glassmorphism styling and ambient glow effects using Tailwind to ${activeFile.name}`)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-gray-300 hover:border-amber-400 hover:text-amber-200 transition-all shrink-0"
            >
              <span>🎨 Dark Glass UI</span>
            </button>
            <button
              onClick={() => handleSendCopilotMessage(`Refactor ${activeFile.name} with clean modular functions and clear comments`)}
              className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#141422] px-2 py-0.5 text-gray-300 hover:border-amber-400 hover:text-amber-200 transition-all shrink-0"
            >
              <span>🧹 Refactor</span>
            </button>
          </div>

          {/* Scrollable Message History */}
          <div
            ref={copilotScrollRef}
            className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs select-text"
          >
            {copilotMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-2.5 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30'
                      : 'bg-[#141422] text-gray-200 border border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                    {msg.role === 'user' ? (
                      <span className="font-semibold text-amber-300">You (in Supru Code)</span>
                    ) : (
                      <>
                        <Sparkles size={11} className="text-amber-400" />
                        <span className="font-semibold text-amber-400">Supru Code Copilot</span>
                      </>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed text-[11.5px]">
                    {msg.text}
                  </div>

                  {/* Render Code Snippet with 1-Click Apply */}
                  {msg.codeSnippet && (
                    <div className="mt-2.5 overflow-hidden rounded-xl border border-white/[0.1] bg-[#090910]">
                      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101018] px-2.5 py-1 text-[10.5px]">
                        <span className="font-mono text-amber-300">
                          {activeFile.name} ({activeFile.language.toUpperCase()})
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopySnippet(msg.codeSnippet!, msg.id)}
                            className="flex items-center gap-1 rounded bg-white/[0.06] hover:bg-white/[0.12] px-2 py-0.5 text-gray-300 hover:text-white transition-colors"
                            title="Copy code"
                          >
                            {copiedSnippetId === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedSnippetId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            onClick={() => handleApplySnippet(msg.codeSnippet!)}
                            className="flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm"
                            title="Apply this code directly to your active editor file"
                          >
                            <CheckCircle2 size={11} />
                            <span>Apply to Editor</span>
                          </button>
                        </div>
                      </div>
                      <pre className="max-h-48 overflow-y-auto p-2.5 text-[10.5px] font-mono text-amber-200/90 whitespace-pre leading-relaxed scrollbar-thin">
                        {msg.codeSnippet.slice(0, 1500)}
                        {msg.codeSnippet.length > 1500 ? '\n... (truncated preview - click Apply to Editor to view all)' : ''}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Analyzing Indicator */}
            {isCopilotThinking && (
              <div className="flex items-center gap-2 rounded-xl bg-[#141422] border border-amber-500/20 px-3 py-2 text-xs text-amber-200 animate-pulse w-fit">
                <RefreshCw size={12} className="animate-spin text-amber-400" />
                <span>Supru Code Copilot is analyzing {activeFile.name}...</span>
              </div>
            )}
          </div>

          {/* Voice Interim Text Banner */}
          {isVoiceListening && (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-[#12121e]/90 px-3 py-1.5 text-xs text-amber-200 shadow-lg animate-fadeIn shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-amber-400 rounded-full animate-pulse" style={{ height: `${Math.max(4, Math.min(16, 4 + (voiceVolume / 100) * 12))}px` }} />
                  <span className="w-1 bg-amber-300 rounded-full animate-pulse" style={{ height: `${Math.max(6, Math.min(18, 6 + (voiceVolume / 100) * 14))}px` }} />
                  <span className="w-1 bg-amber-500 rounded-full animate-pulse" style={{ height: `${Math.max(4, Math.min(14, 4 + (voiceVolume / 100) * 10))}px` }} />
                </span>
                <span className="font-semibold text-amber-300">Listening:</span>
                <span className="italic truncate max-w-[260px] text-gray-300">
                  {voiceInterimText || copilotInput || 'Speak code prompt...'}
                </span>
              </div>
              <button
                onClick={() => stopVoiceListening()}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400"
              >
                Done
              </button>
            </div>
          )}

          {/* Copilot Chat Input Dock */}
          <div className="flex items-center gap-2 pt-1 shrink-0">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendCopilotMessage();
                }
              }}
              placeholder={`Ask Supru Code Copilot about ${activeFile.name}... (Press Enter)`}
              className="w-full rounded-xl border border-white/[0.08] bg-[#141422] px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 font-sans"
            />

            {/* Clear input */}
            {copilotInput && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setCopilotInput('');
                  if (isVoiceListening) stopVoiceListening();
                }}
                className="flex h-8 items-center justify-center rounded-xl px-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs shrink-0"
                title="Clear input"
              >
                <Trash2 size={13} />
              </button>
            )}

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isVoiceListening) {
                  stopVoiceListening();
                } else {
                  startVoiceListening(copilotInput, (newText) => {
                    setCopilotInput(newText);
                  });
                }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                isVoiceListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                  : 'bg-white/[0.06] text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isVoiceListening ? 'Listening... Tap to stop' : 'Voice command'}
            >
              {isVoiceListening ? <MicOff size={13} /> : <Mic size={13} />}
            </button>

            {/* Active Model Tag Pill */}
            <button
              type="button"
              onClick={() => (onOpenAddModels ? onOpenAddModels() : onOpenConnectModel?.())}
              className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-[10px] text-amber-300 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all shrink-0"
              title="Active Model (Click to add or select models)"
            >
              <Sparkles size={10} className="text-amber-400" />
              <span className="truncate max-w-[90px]">{activeModelName || 'Gemini 3.8'}</span>
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSendCopilotMessage()}
              disabled={!copilotInput.trim() || isCopilotThinking}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50 shrink-0"
            >
              {isCopilotThinking ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-neutral-950" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send size={12} className="text-neutral-950" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* TAB 2: DIRECT SYNTHESIZER (1-Click Rewrite Engine)        */
        /* ========================================================= */
        <div className="flex flex-1 flex-col justify-between space-y-2">
          {/* Prompt Message Input Dock */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={generatorPrompt}
              onChange={(e) => setGeneratorPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateByMessage();
                }
              }}
              placeholder="Ask model to synthesize full UI, add features, refactor code, or fix bugs..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#141422] px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 font-sans"
            />

            {/* Clear input */}
            {generatorPrompt && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setGeneratorPrompt('');
                  if (isVoiceListening) stopVoiceListening();
                }}
                className="flex h-8 items-center justify-center rounded-xl px-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs shrink-0"
                title="Clear prompt"
              >
                <Trash2 size={13} />
              </button>
            )}

            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={() => {
                if (isVoiceListening) {
                  stopVoiceListening();
                } else {
                  startVoiceListening(generatorPrompt, (newText) => {
                    setGeneratorPrompt(newText);
                  });
                }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                isVoiceListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_#f43f5e]'
                  : 'bg-white/[0.06] text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isVoiceListening ? 'Listening continuously... Tap to stop' : 'Voice command (Speech recognition)'}
            >
              {isVoiceListening ? <MicOff size={13} /> : <Mic size={13} />}
            </button>

            {/* Active Model Tag Pill */}
            <button
              type="button"
              onClick={() => (onOpenAddModels ? onOpenAddModels() : onOpenConnectModel?.())}
              className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-[10px] text-amber-300 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all shrink-0"
              title="Active Model (Click to add or select models)"
            >
              <Sparkles size={10} className="text-amber-400" />
              <span className="truncate max-w-[90px]">{activeModelName || 'Gemini 3.8'}</span>
            </button>

            <button
              onClick={() => handleGenerateByMessage()}
              disabled={!generatorPrompt.trim() || isGeneratingCode}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50 shrink-0"
            >
              {isGeneratingCode ? (
                <>
                  <RefreshCw size={12} className="animate-spin text-neutral-950" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} className="text-neutral-950" />
                  <span>Synthesize Code</span>
                </>
              )}
            </button>
          </div>

          {/* Model Generation Summary Changelog */}
          {generationSummary && (
            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 size={12} className="text-amber-400 shrink-0" />
                <span className="truncate">{generationSummary}</span>
              </span>
              <button onClick={() => setGenerationSummary(null)} className="text-gray-400 hover:text-white shrink-0 ml-2">
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-[#08080d] text-gray-200 overflow-hidden font-sans text-xs">
      {/* ======================================================== */}
      {/* MAIN DOCKED GRID CONTAINER (Adjustable Split Windows)     */}
      {/* ======================================================== */}
      <div ref={containerRef} className="relative flex flex-1 overflow-hidden">
        {/* State: When All Windows Closed */}
        {!isEditorOpen && !isPreviewOpen && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AppWindow size={24} />
            </div>
            <h3 className="font-bold text-white text-base">All Studio Windows Closed</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Use the <strong className="text-amber-300">Windows ▾</strong> menu above to open Code Editor, Live Preview Sandbox, AI Generator, or Terminal.
            </p>
            <button
              onClick={onResetWindowLayout}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg"
            >
              <RotateCcw size={13} />
              <span>Restore Default Windows</span>
            </button>
          </div>
        )}

        {/* 1. DOCKED SPLIT VIEW: Editor & Preview */}
        {showSplitPanes && (
          <>
            {/* Left Pane: Code Editor */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="flex flex-col overflow-hidden border-r border-white/[0.06] bg-[#0c0c14]"
            >
              {renderEditorContent()}
            </div>

            {/* Draggable Vertical Splitter Handle */}
            <div
              onMouseDown={handleStartHorizontalResize}
              onTouchStart={handleStartHorizontalResize}
              onDoubleClick={() => setSplitRatio(50)}
              className="relative flex items-center justify-center w-2 cursor-col-resize bg-[#101018] hover:bg-amber-500 active:bg-amber-500 transition-colors z-20 group shrink-0 border-x border-white/[0.08]"
              title="Drag to resize Editor / Preview split (Double click to reset 50%)"
            >
              <div className="flex flex-col gap-1 items-center">
                <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
                <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
                <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
              </div>
            </div>

            {/* Right Pane: Live Preview Sandbox */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className="flex flex-col overflow-hidden bg-[#0a0a12]"
            >
              {renderPreviewContent()}
            </div>
          </>
        )}

        {/* 2. DOCKED SINGLE VIEW: Code Editor Only */}
        {showOnlyEditorDocked && (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0c0c14]">
            {renderEditorContent()}
          </div>
        )}

        {/* 3. DOCKED SINGLE VIEW: Live Preview Only */}
        {showOnlyPreviewDocked && (
          <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a12]">
            {renderPreviewContent()}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM DRAWER (AI Generator) with Draggable Resizer      */}
      {/* ======================================================== */}
      {isGeneratorOpen && isGeneratorDocked && (
        <div
          style={{ height: `${drawerHeight}px` }}
          className="relative flex flex-col shrink-0 border-t border-white/[0.08] bg-[#0e0e16]"
        >
          {/* Draggable Horizontal Splitter Handle */}
          <div
            onMouseDown={handleStartVerticalResize}
            onTouchStart={handleStartVerticalResize}
            onDoubleClick={() => setDrawerHeight(180)}
            className="flex h-1.5 w-full cursor-row-resize items-center justify-center bg-[#141422] hover:bg-amber-500 transition-colors group z-20"
            title="Drag to adjust drawer height (Double click to reset)"
          >
            <div className="flex gap-1 items-center">
              <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
              <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
              <span className="h-1 w-1 rounded-full bg-gray-500 group-hover:bg-neutral-950" />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {renderGeneratorContent()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* UNDOCKED FLOATING WINDOWS (Movable & Resizable anywhere)  */}
      {/* ======================================================== */}

      {/* 1. Undocked Code Editor Window */}
      {isEditorOpen && !isEditorDocked && (
        <FloatingWindow
          title="Code Editor"
          icon={<Code2 size={13} className="text-amber-400" />}
          onDock={() => onToggleUndockWindow?.('editor')}
          onClose={() => onToggleWindow?.('editor')}
          initialX={60}
          initialY={60}
          initialWidth={720}
          initialHeight={500}
        >
          {renderEditorContent()}
        </FloatingWindow>
      )}

      {/* 2. Undocked Live Preview Window */}
      {isPreviewOpen && !isPreviewDocked && (
        <FloatingWindow
          title="Live Preview Sandbox"
          icon={<Eye size={13} className="text-emerald-400" />}
          onDock={() => onToggleUndockWindow?.('preview')}
          onClose={() => onToggleWindow?.('preview')}
          initialX={140}
          initialY={80}
          initialWidth={740}
          initialHeight={520}
        >
          {renderPreviewContent()}
        </FloatingWindow>
      )}

      {/* 3. Undocked AI Copilot Window */}
      {isGeneratorOpen && !isGeneratorDocked && (
        <FloatingWindow
          title="Supru Code Copilot & Generator"
          icon={<Sparkles size={13} className="text-amber-400" />}
          onDock={() => onToggleUndockWindow?.('generator')}
          onClose={() => onToggleWindow?.('generator')}
          initialX={180}
          initialY={120}
          initialWidth={600}
          initialHeight={380}
        >
          {renderGeneratorContent()}
        </FloatingWindow>
      )}

      {/* Footer Status Bar (Clean & Compact) */}
      <div className="flex h-6 items-center justify-between border-t border-white/[0.08] bg-[#07070b] px-3 text-[10px] text-gray-500 font-sans select-none shrink-0">
        <div className="flex items-center gap-2">
          <span>File: <strong className="text-gray-300 font-mono">{activeFile.name}</strong></span>
          <span>•</span>
          <span>{lines.length} lines</span>
          <span>•</span>
          <span className="uppercase text-amber-400 font-mono">{activeFile.language}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Split: {Math.round(splitRatio)}% / {Math.round(100 - splitRatio)}%</span>
          <span>•</span>
          <span>Windows: {Object.values(windows).filter(w => w.isOpen).length} open</span>
        </div>
      </div>
    </div>
  );
};
