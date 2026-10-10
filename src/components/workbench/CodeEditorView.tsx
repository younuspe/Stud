import React, { useState, useRef, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { resolveProviderConfig } from '../../lib/providerRegistry';
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

const MONACO_LANGUAGE_BY_FILE: Record<SupportedLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  rust: 'rust',
  go: 'go',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  markdown: 'markdown',
  bash: 'shell',
};


interface CodeEditorViewProps {
  onRunInTerminal: (command: string) => void;
  onSendToChat: (codePrompt: string) => void;
  codingLayout?: CodingSpaceLayout;
  onChangeCodingLayout?: (layout: CodingSpaceLayout) => void;
  localConfig: LocalHostConfig;
  onOpenLocalSettings: () => void;
  onTriggerAgent: (objective: string) => void;
  activeFileBuffer?: { name: string; content: string } | null;
  workspaceRoot?: string;
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
  workspaceRoot = '',
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
  const [activeAiTab, setActiveAiTab] = useState<'copilot' | 'synthesizer'>('synthesizer');
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    codeSnippet?: string;
    timestamp: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('supru_code_copilot_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((message) => message && typeof message.id === 'string' && (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string')) {
          return parsed.slice(-40);
        }
      }
    } catch {}
    return [{
      id: 'copilot-init',
      role: 'assistant',
      text: "👋 **Supru App Builder** is ready. Describe what you want to build, or ask me to improve or fix the current app. Use **Build App** to generate changes and review them in the live preview before saving.",
      timestamp: Date.now(),
    }];
  });
  useEffect(() => {
    try { localStorage.setItem('supru_code_copilot_messages_v1', JSON.stringify(copilotMessages.slice(-40))); } catch {}
  }, [copilotMessages]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const copilotScrollRef = useRef<HTMLDivElement>(null);

  // Files in the editor
  const [files, setFiles] = useState<EditorFile[]>(() => {
    try {
      const saved = localStorage.getItem('supru_code_editor_files_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((file) => file && typeof file.id === 'string' && typeof file.name === 'string' && typeof file.content === 'string' && typeof file.language === 'string')) {
          return parsed;
        }
      }
    } catch {}
    return [{
      id: 'scratch-index-html',
      name: 'index.html',
      language: 'html',
      content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, -apple-system, sans-serif; background: #0b0b12; color: #f3f4f6; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 2rem; }
    main { max-width: 42rem; text-align: center; }
    h1 { margin: 0 0 .75rem; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -.04em; }
    p { margin: 0; color: #a1a1aa; line-height: 1.7; }
    .hint { margin-top: 1.5rem; border: 1px solid #3f3f46; border-radius: .75rem; padding: .8rem 1rem; font-size: .85rem; }
  </style>
</head>
<body>
  <main>
    <h1>Your app starts here.</h1>
    <p>Describe what you want in the Build App panel. Generated code will appear here for editing and live preview.</p>
    <p class="hint">Scratch preview · Open a project folder when you want to save files directly to disk.</p>
  </main>
</body>
</html>`,
    }];
  });
  useEffect(() => {
    try { localStorage.setItem('supru_code_editor_files_v1', JSON.stringify(files)); } catch {}
  }, [files]);
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('supru_code_editor_active_file_v1');
      if (saved && files.some((file) => file.id === saved)) return saved;
    } catch {}
    return files[0].id;
  });
  useEffect(() => {
    try { localStorage.setItem('supru_code_editor_active_file_v1', activeFileId); } catch {}
  }, [activeFileId]);
  const [copied, setCopied] = useState(false);
  const [projectPaths, setProjectPaths] = useState<string[]>([]);
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(null);
  const [isProjectFileLoading, setIsProjectFileLoading] = useState(false);
  const [hasLoadedWorkspace, setHasLoadedWorkspace] = useState(false);
  const [projectFileNotice, setProjectFileNotice] = useState<string | null>(null);

  const isReadableProjectPath = (path: string) => {
    const name = path.split('/').pop() || path;
    return /\.(?:[cm]?[jt]sx?|py|rs|go|html?|css|jsonc?|mdx?|txt|toml|ya?ml|xml|sql|sh|zsh|bash|env|ini|cfg|conf|lock|properties|swift|kt|java|c|h|cc|cpp|hpp|rb|php|vue|svelte|astro|gradle)$/i.test(name)
      || /^(?:Dockerfile|Makefile|GNUmakefile|\.gitignore|\.dockerignore|\.editorconfig|\.npmrc|\.nvmrc|\.prettierrc|\.eslintrc|\.env(?:\..*)?)$/i.test(name);
  };

  const isBuildableSourcePath = (path: string) =>
    /\.(html?|[cm]?[jt]sx?|py|rs|go|css|sql|sh)$/i.test(path) &&
    !/(^|\/)(README(?:\.[^/]*)?|package\.json|Cargo\.toml|tsconfig(?:\.[^/]*)?\.json|vite\.config\.[^/]+|\.eslintrc(?:\.[^/]*)?)$/i.test(path);

  const prioritizeProjectPaths = (paths: string[]) => paths
    .filter(isReadableProjectPath)
    .sort((a, b) => {
      const priority = (path: string) => {
        if (/^(?:index|src\/App)\.[cm]?[jt]sx?$/i.test(path) || /^index\.html$/i.test(path)) return 0;
        if (/^src\/(?:main|index)\.[cm]?[jt]sx?$/i.test(path)) return 1;
        if (/^(?:app|main)\.(?:py|js|ts|tsx|jsx|html)$/i.test(path)) return 2;
        if (/^src\/main\.rs$/i.test(path) || /^src\/lib\.rs$/i.test(path)) return 3;
        if (/^package\.json$/i.test(path)) return 6;
        if (/^Cargo\.toml$/i.test(path)) return 7;
        if (/^README(?:\.[^/]*)?$/i.test(path)) return 9;
        return 10;
      };
      return priority(a) - priority(b) || a.localeCompare(b);
    });

  const languageForPath = (path: string): SupportedLanguage => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    const languages: Record<string, SupportedLanguage> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', rs: 'rust', go: 'go', html: 'html', htm: 'html',
      css: 'css', json: 'json', md: 'markdown', mdx: 'markdown',
      sql: 'sql', sh: 'bash', zsh: 'bash',
    };
    return languages[extension] || 'markdown';
  };

  const openProjectFile = async (relativePath: string) => {
    if (!workspaceRoot) return;
    if (activeFile?.isModified && activeFileId === `workspace-file:${activeProjectPath}`) {
      const proceed = window.confirm(`Discard unsaved edits to ${activeProjectPath}? Choose Cancel to keep editing.`);
      if (!proceed) return;
    }
    setIsProjectFileLoading(true);
    setProjectFileNotice(null);
    try {
      const source = await invoke<string>('read_workspace_file', {
        workspaceRoot,
        relativePath,
      });
      const id = `workspace-file:${relativePath}`;
      const nextFile: EditorFile = {
        id,
        name: relativePath,
        language: languageForPath(relativePath),
        content: source,
      };
      setFiles((current) => {
        const projectFiles = current.filter((item) => item.id.startsWith('workspace-file:'));
        const others = current.filter((item) => !item.id.startsWith('workspace-file:'));
        const existing = projectFiles.some((item) => item.id === id);
        return existing
          ? [...others, ...projectFiles.map((item) => item.id === id ? nextFile : item)]
          : [...others, ...projectFiles, nextFile];
      });
      setActiveFileId(id);
      setActiveProjectPath(relativePath);
      setProjectFileNotice(`Opened ${relativePath}`);
    } catch (error) {
      setProjectFileNotice(`Could not open ${relativePath}: ${String(error)}`);
    } finally {
      setIsProjectFileLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!workspaceRoot) {
      setProjectPaths([]);
      setActiveProjectPath(null);
      setProjectFileNotice(null);
      setHasLoadedWorkspace(true);
      return;
    }
    setHasLoadedWorkspace(false);
    setIsProjectFileLoading(true);
    setProjectFileNotice(null);
    setActiveProjectPath(null);
    setFiles((current) => current.filter((item) => !item.id.startsWith('workspace-file:')));
    invoke<string[]>('list_workspace_files', { workspaceRoot, relativeDir: null })
      .then(async (paths) => {
        if (cancelled) return;
        const readablePaths = prioritizeProjectPaths(paths);
        setProjectPaths(readablePaths);
        if (readablePaths.length === 0) {
          setProjectFileNotice('No supported text/code files were found in this folder. Binary assets are not opened in the code editor.');
          return;
        }
        const currentPath = activeProjectPath && readablePaths.includes(activeProjectPath) ? activeProjectPath : readablePaths[0];
        const source = await invoke<string>('read_workspace_file', { workspaceRoot, relativePath: currentPath });
        if (cancelled) return;
        const id = `workspace-file:${currentPath}`;
        const nextFile: EditorFile = { id, name: currentPath, language: languageForPath(currentPath), content: source };
        setFiles((current) => {
          const others = current.filter((item) => !item.id.startsWith('workspace-file:'));
          return [...others, nextFile];
        });
        setActiveFileId(id);
        setActiveProjectPath(currentPath);
        setProjectFileNotice(`Project loaded: ${readablePaths.length} readable files found.`);
      })
      .catch((error) => {
        if (!cancelled) setProjectFileNotice(`Could not read project folder: ${String(error)}`);
      })
      .finally(() => {
        if (!cancelled) {
          setIsProjectFileLoading(false);
          setHasLoadedWorkspace(true);
        }
      });
    return () => { cancelled = true; };
  // Loading is intentionally triggered only when the selected root changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceRoot]);

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
  const lineCount = activeFile.content.split('\n').length;

  // If a file was sent from GitHub or CLI
  useEffect(() => {
    if (activeFileBuffer) {
      if (isTauri() && workspaceRoot && /^generated-app-\d+\.html$/i.test(activeFileBuffer.name)) {
        // The Studio has already created this unique file through the native Rust boundary.
        // Open it as a real project file so Monaco's Save action remains connected to disk.
        void openProjectFile(activeFileBuffer.name);
        return;
      }
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

  const handleSaveProjectFile = async () => {
    if (!workspaceRoot || !activeProjectPath || !activeFile || activeFileId !== `workspace-file:${activeProjectPath}`) {
      setProjectFileNotice('Select a file from the Project File list before saving; demo tabs are not project files.');
      return;
    }
    try {
      const result = await invoke<string>('write_workspace_file', {
        workspaceRoot,
        relativePath: activeProjectPath,
        content: activeFile.content,
      });
      setFiles((current) => current.map((item) => item.id === activeFileId ? { ...item, isModified: false } : item));
      setProjectFileNotice(result);
    } catch (error) {
      setProjectFileNotice(`Save failed: ${String(error)}`);
    }
  };

  const handleCreateFile = async () => {
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
    if (workspaceRoot) {
      const availableName = `app_${Date.now()}.html`;
      try {
        await invoke<string>('write_workspace_file', {
          workspaceRoot,
          relativePath: availableName,
          content: newFile.content,
        });
        newFile.id = `workspace-file:${availableName}`;
        newFile.name = availableName;
        setProjectPaths((prev) => [...prev, availableName].sort());
        setActiveProjectPath(availableName);
        setProjectFileNotice(`Created ${availableName} in the selected project.`);
      } catch (error) {
        setProjectFileNotice(`Could not create file in project: ${String(error)}`);
        return;
      }
    }
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
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
  const handleGenerateByMessage = async (presetPrompt?: string, saveProjectFile = false) => {
    const promptToSend = presetPrompt || generatorPrompt.trim();
    if (!promptToSend || isGeneratingCode) return;
    // Build-by-Chat must never overwrite a README or project manifest just because it was selected first.
    const buildIntoNewFile = Boolean(workspaceRoot) &&
      (!activeProjectPath || !isBuildableSourcePath(activeProjectPath));
    const targetLanguage: SupportedLanguage = buildIntoNewFile ? 'html' : activeFile.language;
    const targetFileName = buildIntoNewFile ? 'generated-app.html' : activeFile.name;
    const targetSource = buildIntoNewFile ? '' : activeFile.content;

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
          apiKey: localConfig.apiKey,
          endpointUrl: localConfig.endpointUrl,
        };

    try {
      let data: { code?: string; explanation?: string; error?: string };
      if (isTauri()) {
        const nativeModel = resolveProviderConfig(localConfig, activeCustomModel);
        const responseText = await invoke<string>('chat_completion', {
          provider: nativeModel.provider,
          endpointUrl: nativeModel.endpointUrl,
          modelName: nativeModel.modelName,
          apiKey: nativeModel.apiKey,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are Supru Code's app builder. Apply the user's requested changes to the current ${targetLanguage} file. Return the COMPLETE updated file inside one fenced code block, then give a short explanation. Do not claim changes were applied; the UI will apply the returned code only after receiving it. Current file: ${targetFileName}.\n\nCurrent source starts below:\n${targetSource}\n\nCurrent source ends above.`,
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
            currentCode: targetSource,
            language: targetLanguage,
            fileName: targetFileName,
            modelConfig: modelConfigPayload,
          }),
        });
        data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Generation failed (HTTP ${res.status})`);
      }

      if (data.code) {
        let persistenceNote = 'Updated the live preview buffer only. Select a project folder to save generated code to disk.';
        if (isTauri() && workspaceRoot) {
          const isWorkspaceFile = activeFileId.startsWith('workspace-file:') && Boolean(activeProjectPath);
          if (isWorkspaceFile && !buildIntoNewFile) {
            if (saveProjectFile) {
              // Build-by-Chat is an explicit request to modify the selected project file.
              const saveResult = await invoke<string>('write_workspace_file', {
                workspaceRoot,
                relativePath: activeProjectPath,
                content: data.code,
              });
              setFiles((current) => current.map((item) => item.id === activeFileId
                ? { ...item, content: data.code, isModified: false }
                : item));
              setProjectFileNotice(saveResult || `Saved generated changes to ${activeProjectPath}.`);
              persistenceNote = `Saved changes to project file ${activeProjectPath}.`;
            } else {
              // The ordinary Generate action stages edits for review before saving.
              handleUpdateContent(data.code);
              setProjectFileNotice(`Unsaved generated changes in ${activeProjectPath}. Review them, then choose Save to Project.`);
              persistenceNote = `Changes staged in ${activeProjectPath}; use Save to Project to write them.`;
            }
          } else {
            // Generating from a demo tab creates a new project file instead of overwriting a real file.
            const extension = buildIntoNewFile ? 'html' : (activeFile.name.split('.').pop() || 'html').replace(/[^a-z0-9]/gi, '') || 'html';
            const targetPath = `generated-app-${Date.now()}.${extension}`;
            const targetId = `workspace-file:${targetPath}`;
            const saveResult = await invoke<string>('write_workspace_file', {
              workspaceRoot,
              relativePath: targetPath,
              content: data.code,
            });
            const savedFile: EditorFile = {
              id: targetId,
              name: targetPath,
              language: targetLanguage,
              content: data.code,
              isModified: false,
            };
            setFiles((current) => [...current.filter((item) => item.id !== targetId), savedFile]);
            setActiveFileId(targetId);
            setActiveProjectPath(targetPath);
            setProjectPaths((current) => Array.from(new Set([...current, targetPath])).sort());
            setProjectFileNotice(saveResult || `Created ${targetPath} in the selected project.`);
            persistenceNote = `Created project file ${targetPath}.`;
          }
        } else {
          handleUpdateContent(data.code);
        }
        setGenerationSummary(`${data.explanation || `Code updated by ${modelConfigPayload.modelId || 'the selected AI model'}.`} ${persistenceNote}`);
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

  // Build prompts use the project-aware generator; ordinary prompts remain in Copilot chat.
  // Wait for project discovery to finish so a build cannot accidentally target a demo tab.
  useEffect(() => {
    if (!externalPrompt?.text?.trim()) return;

    if (externalPrompt.id.startsWith('build-prompt-')) {
      if (!workspaceRoot || isProjectFileLoading || !hasLoadedWorkspace) return;
      if (projectPaths.length > 0 && (!activeProjectPath || !activeFileId.startsWith('workspace-file:'))) return;

      if (!windows.generator?.isOpen) onToggleWindow?.('generator');
      if (drawerHeight < 280) setDrawerHeight(340);
      setActiveAiTab('synthesizer');
      void handleGenerateByMessage(externalPrompt.text.trim(), true);
      onClearExternalPrompt?.();
      return;
    }

    if (!windows.generator?.isOpen) onToggleWindow?.('generator');
    if (drawerHeight < 280) setDrawerHeight(340);
    setActiveAiTab('copilot');
    handleSendCopilotMessage(externalPrompt.text.trim());
    onClearExternalPrompt?.();
  }, [externalPrompt, workspaceRoot, isProjectFileLoading, hasLoadedWorkspace, projectPaths.length, activeProjectPath, activeFileId]);

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
          apiKey: localConfig.apiKey,
          endpointUrl: localConfig.endpointUrl,
        };

    try {
      let data: { reply?: string; code?: string | null; error?: string };
      if (isTauri()) {
        const nativeModel = resolveProviderConfig(localConfig, activeCustomModel);
        const systemInstruction = `You are Supru Code Copilot and chat-driven app builder inside the installed Supru desktop app. The selected model is ${nativeModel.modelName} via ${nativeModel.provider}. The active file is ${activeFile.name} (${activeFile.language}).\n\nWork first, explain second. When the user asks to build, create, improve, or fix an app, do not reply with a checklist asking them to attach a repository or describe the architecture. Use the active source and the user's requirements to produce the best concrete implementation you can. Return the COMPLETE updated active file in exactly one fenced code block, followed by a concise summary and any important limitation. Do not claim to have inspected files that were not supplied, and do not invent hidden project APIs or provider integrations. If the request needs unseen files, still make useful progress in the active file and identify the exact missing integration point briefly instead of stopping. Never claim code was applied; the editor applies it only when the user chooses Apply.\n\nCurrent active file source:\n${activeFile.content}`;
        const responseText = await invoke<string>('chat_completion', {
          provider: nativeModel.provider,
          endpointUrl: nativeModel.endpointUrl,
          modelName: nativeModel.modelName,
          apiKey: nativeModel.apiKey,
          temperature: 0.2,
          messages: [
            { role: 'system', content: systemInstruction },
            ...nextMessages.filter((m) => m.id !== 'copilot-init').map((m) => ({ role: m.role, content: m.text })),
          ],
        });
        data = { reply: responseText, code: extractGeneratedCode(responseText) };
      } else {
        const res = await fetch('/api/studio/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.filter((m) => m.id !== 'copilot-init').map((m) => ({ role: m.role, content: m.text })),
            currentCode: activeFile.content,
            fileName: activeFile.name,
            language: activeFile.language,
            modelConfig: modelConfigPayload,
          }),
        });
        data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Copilot request failed (HTTP ${res.status})`);
      }

      const asstMsgId = `asst-${Date.now()}`;
      setCopilotMessages((prev) => [
        ...prev,
        {
          id: asstMsgId,
          role: 'assistant',
          text: data.reply || 'The model returned no explanation.',
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
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    if (activeFile.language !== 'html') {
      return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Source preview</title>' +
        '<style>body{margin:0;padding:24px;background:#0b0b12;color:#f1f2f6;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace}main{max-width:1000px;margin:0 auto}h1{color:#fbbf24;font-size:13px;text-transform:uppercase}pre{overflow:auto;padding:16px;border:1px solid #27272a;border-radius:10px;background:#111118;white-space:pre-wrap;overflow-wrap:anywhere}p{color:#a1a1aa}</style>' +
        '</head><body><main><h1>' + escapeHtml(activeFile.name) + ' (' + escapeHtml(activeFile.language.toUpperCase()) + ')</h1>' +
        '<p>Live UI preview is available for HTML files. This is a safe, read-only source preview.</p><pre>' +
        escapeHtml(activeFile.content) + '</pre></main></body></html>';
    }

    const interceptor = [
      '<script>',
      '(function(){',
      '  const sendLog = (level, args) => {',
      '    try {',
      '      const msg = args.map(a => { if (typeof a === "string") return a; try { return JSON.stringify(a); } catch (_) { return String(a); } }).join(" ");',
      '      window.parent.postMessage({ source: "supru-sandbox", type: "log", level, message: msg }, "*");',
      '    } catch(e) {}',
      '  };',
      '  const origLog = console.log, origInfo = console.info, origWarn = console.warn, origError = console.error;',
      '  console.log = (...args) => { origLog(...args); sendLog("log", args); };',
      '  console.info = (...args) => { origInfo(...args); sendLog("info", args); };',
      '  console.warn = (...args) => { origWarn(...args); sendLog("warn", args); };',
      '  console.error = (...args) => { origError(...args); sendLog("error", args); };',
      '  window.onerror = function(msg, url, line) { window.parent.postMessage({ source: "supru-sandbox", type: "error", message: msg + " (Line " + line + ")" }, "*"); return false; };',
      '  window.onunhandledrejection = function(event) { const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason); window.parent.postMessage({ source: "supru-sandbox", type: "error", message: "Unhandled promise rejection: " + reason }, "*"); };',
      '})();',
      '</script>'
    ].join('\n');

    const source = activeFile.content.trim();
    const headTag = /<head(?:\s[^>]*)?>/i;
    const htmlTag = /<html(?:\s[^>]*)?>/i;
    if (headTag.test(source)) return source.replace(headTag, (tag) => tag + interceptor);
    if (htmlTag.test(source)) return source.replace(htmlTag, (tag) => tag + '<head>' + interceptor + '</head>');
    if (/<body(?:\s[^>]*)?>/i.test(source)) return '<!doctype html><html><head>' + interceptor + '</head>' + source + '</html>';
    return '<!doctype html><html><head>' + interceptor + '</head><body>' + source + '</body></html>';
  }, [activeFile.content, activeFile.language, activeFile.name]);


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
      <div className="flex min-h-8 items-center justify-between gap-2 border-b border-white/[0.08] bg-[#101018] px-2 py-1 text-[11px] shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          {workspaceRoot ? (
            <>
              <select
                aria-label="Open project file"
                value={activeProjectPath || ''}
                disabled={isProjectFileLoading || projectPaths.length === 0}
                onChange={(event) => { if (event.target.value) void openProjectFile(event.target.value); }}
                className="max-w-[220px] min-w-[120px] rounded-md border border-emerald-500/30 bg-[#0c1715] px-2 py-1 text-[10px] text-emerald-200 outline-none"
              >
                {projectPaths.length === 0 && <option value="">No project files</option>}
                {projectPaths.map((path) => <option key={path} value={path}>{path}</option>)}
              </select>
              <span className="hidden max-w-[180px] truncate text-[9px] text-emerald-300/70 xl:inline" title={workspaceRoot}>{workspaceRoot}</span>
              <button type="button" onClick={() => void handleSaveProjectFile()} disabled={!activeProjectPath || isProjectFileLoading} className="rounded-md border border-emerald-500/30 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40">Save to Project</button>
            </>
          ) : (
            <span className="px-1 text-[10px] text-amber-300/80">Scratch app — use Open Project above to edit and save a real project</span>
          )}
        </div>
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
      {projectFileNotice && (
        <div role="status" className="shrink-0 border-b border-white/[0.06] bg-[#0c1015] px-3 py-1 text-[10px] text-gray-400">
          {projectFileNotice}
        </div>
      )}

      {/* Monaco source editor: syntax highlighting, folding, minimap, and keyboard shortcuts */}
      <div className="flex flex-1 overflow-hidden bg-[#09090f]">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_BY_FILE[activeFile.language] || 'plaintext'}
          value={activeFile.content}
          onChange={(value) => handleUpdateContent(value ?? '')}
          theme="vs-dark"
          options={{
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 12,
            fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            tabSize: 2,
            insertSpaces: true,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            folding: true,
            glyphMargin: true,
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          }}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleManualRunPreview());
          }}
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
              sandbox="allow-scripts allow-modals allow-forms"
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
            title="Chat with the selected AI model about the current app"
          >
            <MessageSquare size={12} />
            <span>Chat</span>
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
            <span>Build App</span>
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
            title="Close build panel (reopen from the panel controls)"
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
              Use the Open Project button above to choose a real project folder, or continue in the scratch app and export your file.
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
          <span>{lineCount} lines</span>
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
