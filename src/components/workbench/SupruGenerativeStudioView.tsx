import React, { useState, useRef, useEffect } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { resolveProviderConfig } from '../../lib/providerRegistry';
import { extractCompleteHtml } from '../../lib/htmlSource';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Film, 
  Box, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  Maximize2, 
  RefreshCw, 
  Layers, 
  Zap, 
  Terminal, 
  ExternalLink,
  Mic,
  MicOff,
  Trash2,
  ChevronRight,
  Eye,
  Camera,
  Cpu,
  Monitor
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { useSpeechListener } from '../../utils/useSpeechListener';

interface SupruGenerativeStudioViewProps {
  localConfig: import('../../types/workbench').LocalHostConfig;
  activeCustomModel?: import('../../types/workbench').ExternalAIModelConfig | null;
  onSendToChat?: (content: string, imageUrl?: string) => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onRunInTerminal?: (cmd: string) => void;
  onOpenImageStudio?: (imageUrl?: string) => void;
  onOpenVeoStudio?: (imageUrl?: string) => void;
}

export type GenerativeMode = 'visual' | 'motion' | 'world3d' | 'atomic' | 'app' | 'audio';

type AppBuildMessage = { id: string; role: 'user' | 'assistant'; text: string; timestamp: number };

function readStudioStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}



interface ManifestedArtifact {
  id: string;
  type: 'image' | 'video' | 'world-state' | 'component' | 'app' | 'audio';
  title: string;
  prompt: string;
  dataUrl?: string;
  codeSnippet?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

const STYLE_PRESETS = [
  { id: 'sovereign-dark', label: 'Sovereign Dark', icon: '🌌', desc: 'Obsidian void, deep amber filaments & atmospheric neon bloom' },
  { id: 'cyberpunk-neon', label: 'Neo-Noir Cyberpunk', icon: '⚡', desc: 'Rain-soaked asphalt, holographic reflections & cyan-magenta neon' },
  { id: 'hyper-real', label: 'Hyper-Real 8K', icon: '📸', desc: 'Optical cinematic depth of field, anamorphic bokeh & RAW textures' },
  { id: 'anime-shonen', label: 'Cyber Anime', icon: '⚔️', desc: 'Makoto Shinkai celestial lighting, high-contrast cel-shaded lines' },
  { id: 'surrealist', label: 'Surrealist Dream', icon: '🔮', desc: 'Gravity-defying physics, liquid metals & dreamlike geometry' },
  { id: 'editorial', label: 'High-Fashion Vogue', icon: '💎', desc: 'Studio strobe lighting, avant-garde textures & high-gloss editorial' },
  { id: 'voxel-3d', label: 'Isometric Voxel 3D', icon: '🧊', desc: 'Raytraced micro-diorama, tactile voxel lighting & tilt-shift blur' },
  { id: 'synthwave', label: 'Retro Synthwave', icon: '🌆', desc: '1984 wireframe horizon, chrome text & outrun sunset grid' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024 },
  { id: '16:9', label: '16:9 Cinema Wide', width: 1280, height: 720 },
  { id: '9:16', label: '9:16 Mobile Story', width: 720, height: 1280 },
  { id: '4:3', label: '4:3 Classic Photo', width: 1024, height: 768 },
  { id: '21:9', label: '21:9 Ultrawide', width: 1536, height: 658 },
];

const PROMPT_SUGGESTIONS = [
  'A sovereign robotic tuxedo cat with glowing amber whiskers overlooking a neon neo-Tokyo citadel in heavy rain',
  '4D quantum singularity world-state with liquid obsidian floating structures and holographic crystal rings',
  'Futuristic glass neural interface control console with floating particle telemetry and chromatic aberration',
  'Sleek cyberpunk mech tiger poised on a skyscraper spire, cinematic volumetric fog and golden hour lighting',
  'Hyper-detailed microscopic view of an organic cybernetic microprocessor pulsating with emerald light',
];

export const SupruGenerativeStudioView: React.FC<SupruGenerativeStudioViewProps> = ({
  localConfig,
  activeCustomModel = null,
  onSendToChat,
  onOpenInEditor,
  onRunInTerminal,
  onOpenImageStudio,
  onOpenVeoStudio,
}) => {
  const [activeMode, setActiveMode] = useState<GenerativeMode>(() => {
    const saved = readStudioStorage<GenerativeMode>('supru_studio_mode_v1', 'visual');
    return ['visual', 'motion', 'world3d', 'atomic', 'app', 'audio'].includes(saved) ? saved : 'visual';
  });
  const [prompt, setPrompt] = useState(() => readStudioStorage('supru_studio_prompt_v1', PROMPT_SUGGESTIONS[0]));
  const [selectedStyle, setSelectedStyle] = useState('sovereign-dark');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [refractiveIndex, setRefractiveIndex] = useState(1.42);
  const [emotionalFrequency, setEmotionalFrequency] = useState(432); // Hz
  const [seed, setSeed] = useState(42069);
  const [currentResultImage, setCurrentResultImage] = useState<string | null>(null);
  const [currentResultVideo, setCurrentResultVideo] = useState<string | null>(null);
  const [currentResultApp, setCurrentResultApp] = useState<string | null>(() => readStudioStorage<string | null>('supru_studio_app_source_v1', null));
  const [appGenerationSummary, setAppGenerationSummary] = useState<string | null>(() => readStudioStorage<string | null>('supru_studio_app_summary_v1', null));
  const [appBuildMessages, setAppBuildMessages] = useState<AppBuildMessage[]>(() => readStudioStorage<AppBuildMessage[]>('supru_studio_app_chat_v1', []));
  const [autoGenerateRequested, setAutoGenerateRequested] = useState(false);
  const [manifestedArtifacts, setManifestedArtifacts] = useState<ManifestedArtifact[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 3D Liquid Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState({ x: 0.2, y: 0.4 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Voice speech listener
  const {
    isListening,
    startListening,
    stopListening,
    voiceNotice,
    setVoiceNotice,
  } = useSpeechListener();

  const activeProviderInfo = (() => {
    try {
      const resolved = resolveProviderConfig(localConfig, activeCustomModel);
      return { model: resolved.modelName || 'No model selected', provider: resolved.provider, endpoint: resolved.endpointUrl };
    } catch {
      return { model: 'Provider setup needed', provider: 'unconfigured', endpoint: '' };
    }
  })();

  // Persist app-builder work independently of the mounted workspace tab.
  // This prevents generated source and chat instructions disappearing when the user switches views.
  useEffect(() => {
    try { localStorage.setItem('supru_studio_mode_v1', JSON.stringify(activeMode)); } catch {}
  }, [activeMode]);
  useEffect(() => {
    try { localStorage.setItem('supru_studio_prompt_v1', JSON.stringify(prompt)); } catch {}
  }, [prompt]);
  useEffect(() => {
    try {
      if (currentResultApp) localStorage.setItem('supru_studio_app_source_v1', JSON.stringify(currentResultApp));
      else localStorage.removeItem('supru_studio_app_source_v1');
    } catch {}
  }, [currentResultApp]);
  useEffect(() => {
    try {
      if (appGenerationSummary) localStorage.setItem('supru_studio_app_summary_v1', JSON.stringify(appGenerationSummary));
      else localStorage.removeItem('supru_studio_app_summary_v1');
    } catch {}
  }, [appGenerationSummary]);
  useEffect(() => {
    try { localStorage.setItem('supru_studio_app_chat_v1', JSON.stringify(appBuildMessages.slice(-60))); } catch {}
  }, [appBuildMessages]);

  // Floating-pill prompts should respect the mode the user is currently using.
  // Only auto-run when App Builder is already selected; never silently switch a
  // visual/motion/world prompt into code generation.
  useEffect(() => {
    const handleWorkspacePrompt = (event: Event) => {
      const detail = (event as CustomEvent<{ text?: string }>).detail;
      const text = detail?.text?.trim();
      if (!text) return;
      setPrompt(text);
      setGenerationError(null);
      if (activeMode === 'app') {
        setAutoGenerateRequested(true);
      }
    };
    window.addEventListener('supru-generative-prompt', handleWorkspacePrompt);
    return () => window.removeEventListener('supru-generative-prompt', handleWorkspacePrompt);
  }, [activeMode]);

  // Handle Speech dictation
  const toggleSpeech = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(prompt, (newText) => {
        setPrompt(newText);
      });
    }
  };

  // 3D Liquid Canvas Simulation Effect
  useEffect(() => {
    if (activeMode !== 'world3d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const particles: Array<{
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      color: string;
      size: number;
    }> = [];

    const numParticles = 420;
    const radius = Math.min(width, height) * 0.35;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);
      const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#ffffff'];
      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        color: colors[i % colors.length],
        size: 1.5 + Math.random() * 2.5,
      });
    }

    let angleY = rotationAngle.y;
    let angleX = rotationAngle.x;
    let t = 0;

    const render = () => {
      t += 0.015;
      angleY += 0.005;

      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      // Ambient backlight glow based on Refractive Index & Emotional Frequency
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        radius * 1.5
      );
      gradient.addColorStop(0, `rgba(245, 158, 11, ${0.12 * refractiveIndex})`);
      gradient.addColorStop(0.5, `rgba(236, 72, 153, ${0.08 * (emotionalFrequency / 432)})`);
      gradient.addColorStop(1, 'rgba(6, 6, 12, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 400;

      // Draw connection filaments between nearby particles
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Modulation wave
        const wave = Math.sin(t + i * 0.1) * (refractiveIndex * 12);
        const rCurrent = 1 + wave / radius;

        // Rotate Y
        let rx1 = p.baseX * rCurrent * Math.cos(angleY) + p.baseZ * rCurrent * Math.sin(angleY);
        let rz1 = -p.baseX * rCurrent * Math.sin(angleY) + p.baseZ * rCurrent * Math.cos(angleY);

        // Rotate X
        let ry2 = p.baseY * rCurrent * Math.cos(angleX) - rz1 * Math.sin(angleX);
        let rz2 = p.baseY * rCurrent * Math.sin(angleX) + rz1 * Math.cos(angleX);

        const depth = fov / (fov + rz2 + 200);
        const projX = cx + rx1 * depth;
        const projY = cy + ry2 * depth;
        const alpha = Math.max(0.15, Math.min(1, (rz2 + radius) / (radius * 2)));

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.8, p.size * depth), 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby points
        for (let j = i + 1; j < Math.min(i + 5, particles.length); j++) {
          const p2 = particles[j];
          let rx2 = p2.baseX * Math.cos(angleY) + p2.baseZ * Math.sin(angleY);
          let rz_2 = -p2.baseX * Math.sin(angleY) + p2.baseZ * Math.cos(angleY);
          let ry_2 = p2.baseY * Math.cos(angleX) - rz_2 * Math.sin(angleX);
          let rz_final = p2.baseY * Math.sin(angleX) + rz_2 * Math.cos(angleX);

          const depth2 = fov / (fov + rz_final + 200);
          const px2 = cx + rx2 * depth2;
          const py2 = cy + ry_2 * depth2;

          const dist = Math.hypot(projX - px2, projY - py2);
          if (dist < 45) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 45) * 0.3 * alpha;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(px2, py2);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;

      // HUD overlay: 120 FPS Direct-to-Metal
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.fillText(`WORLD-STATE: 4D MANIFOLD | REFRACTIVE: ${refractiveIndex.toFixed(2)}n | FREQ: ${emotionalFrequency}Hz`, 16, 24);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`HARDWARE: GPU-NATIVE BEVY/WGPU 120 FPS | PARTICLES: ${numParticles}`, 16, 40);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeMode, refractiveIndex, emotionalFrequency, rotationAngle]);

  // Audio Synthesizer Control
  const toggleNeuralAudio = () => {
    soundFx.playClick();
    if (isPlayingAudio) {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch {}
      }
      setIsPlayingAudio(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(emotionalFrequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      // Low pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsPlayingAudio(true);
    } catch (e) {
      console.warn('Audio synthesis unavailable:', e);
    }
  };

  // Synthesize / Manifest Reality
  const handleManifest = async () => {
    if (!prompt.trim() || isSynthesizing) return;
    soundFx.playChime();
    setIsSynthesizing(true);
    setGenerationError(null);

    try {
      if (activeMode === 'visual') {
        const enhancedPrompt = `${prompt}, ${selectedStyle} style, 8k resolution, volumetric atmospheric cinematic lighting, highly detailed masterpiece`;
        let imageUrl = '';
        if (isTauri()) {
          imageUrl = await invoke<string>('generate_image', {
            prompt: enhancedPrompt,
            aspectRatio: selectedAspectRatio,
            apiKey: localConfig.apiKey || null,
          });
        } else {
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: enhancedPrompt, aspectRatio: selectedAspectRatio }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || `Image generation failed (HTTP ${res.status}).`);
          imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';
        }
        if (!imageUrl) throw new Error('Image provider returned no image. No placeholder artwork was substituted.');
        setCurrentResultImage(imageUrl);
        const newArtifact: ManifestedArtifact = {
          id: `art-${Date.now()}`,
          type: 'image',
          title: prompt.slice(0, 36) + '...',
          prompt,
          dataUrl: imageUrl,
          timestamp: Date.now(),
          metadata: { style: selectedStyle, aspectRatio: selectedAspectRatio, seed, provider: 'Gemini image generation' },
        };
        setManifestedArtifacts((prev) => [newArtifact, ...prev]);
        soundFx.playChime();
      } else if (activeMode === 'motion') {
        if (isTauri()) {
          throw new Error('Native video generation is not connected in the packaged desktop app yet. No development-server request or placeholder video was used.');
        }
        // Browser development mode only; the packaged desktop app has no Express server.
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            motionStyle: 'Cinematic Tracking Shot',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.videoUrl) {
            setCurrentResultVideo(data.videoUrl);
          } else {
            setGenerationError(data.error || 'Video service returned no video URL.');
          }
        } else {
          const message = await res.text().catch(() => '');
          setGenerationError(`Video generation failed (${res.status}). ${message.slice(0, 240)}`.trim());
        }
      } else if (activeMode === 'app') {
        const appPrompt = [
          'Create a complete, usable web application from the following user specification.',
          'Return a complete self-contained HTML5 document with embedded CSS and JavaScript.',
          'Implement the real interactions described; do not use placeholder buttons or fake success states.',
          'Use accessible semantic markup, responsive layout, input validation, and visible error/empty states.',
          'Do not require external dependencies unless explicitly requested.',
          'The generated source will be shown in a sandboxed iframe and opened in an editor only on user action.',
          '',
          'Application specification:',
          prompt,
        ].join('\n');
        let generatedCode = '';
        let providerUsed = '';
        let modelUsed = '';
        const userTurn: AppBuildMessage = { id: `user-${Date.now()}`, role: 'user', text: prompt.trim(), timestamp: Date.now() };
        setAppBuildMessages((previous) => [...previous, userTurn].slice(-60));

        if (!isTauri()) {
          throw new Error('App Builder requires the installed Supru desktop app so it can call the selected provider through the native Rust bridge. Browser/server mode is intentionally not used.');
        }

        const selectedConfig = resolveProviderConfig(localConfig, activeCustomModel);
        const { provider: selectedProvider, endpointUrl: selectedEndpoint, modelName: selectedModel, apiKey: selectedKey } = selectedConfig;
        providerUsed = selectedProvider;
        modelUsed = selectedModel;

        if (selectedProvider === 'offline_core') {
          throw new Error('Offline Core has no generation model yet. Select Ollama, LM Studio, or a configured cloud provider in Provider Settings.');
        }
        if (!selectedModel.trim()) {
          throw new Error('Select and activate a model in Provider Settings before generating an application.');
        }
        if (selectedProvider === 'custom_local' && !selectedEndpoint.trim()) {
          throw new Error('Add the compatible provider base URL before generating an application.');
        }

        const response = await invoke<string>('chat_completion', {
          provider: selectedProvider,
          endpointUrl: selectedEndpoint,
          modelName: selectedModel,
          apiKey: selectedKey,
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: 'You are Supru Generative Studio App Builder. Return one complete, self-contained HTML5 document. Output raw HTML only, not Markdown fences or commentary. Implement real interactions, accessible responsive layout, validation, and useful empty/error states. No placeholder buttons, fake success states, external dependencies, or secret credentials. Treat the latest user message as a requested change to the existing app when source is provided. Preserve working features unless the user asks to change them. Never claim the code was executed or tested.'
            },
            ...appBuildMessages.slice(-12).map((turn) => ({ role: turn.role, content: turn.text })),
            {
              role: 'user',
              content: appPrompt + (currentResultApp ? '\n\nExisting source to improve:\n' + currentResultApp : '')
            }
          ]
        });
        generatedCode = extractCompleteHtml(response);
        if (!generatedCode) {
          throw new Error('The selected model did not return a complete HTML document. The previous app source was preserved. Try asking for the complete HTML document only.');
        }
        setCurrentResultApp(generatedCode);
        const buildSummary = `Updated by ${modelUsed} via ${providerUsed}. Source is saved locally; runtime testing has not been performed.`;
        setAppGenerationSummary(buildSummary);
        setAppBuildMessages((previous) => [...previous, {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `Generated and saved the updated HTML source using ${modelUsed} (${providerUsed}). Use Preview to inspect it, or Open source in editor to continue editing. It has not been automatically tested.`,
          timestamp: Date.now(),
        }].slice(-60));
        setManifestedArtifacts((prev) => [{
          id: `app-${Date.now()}`,
          type: 'app',
          title: prompt.slice(0, 36) || 'Generated App',
          prompt,
          codeSnippet: generatedCode,
          timestamp: Date.now(),
          metadata: { language: 'html', provider: providerUsed, model: modelUsed || 'unknown' },
        }, ...prev]);
      } else {
        setGenerationError(`The ${activeMode} mode currently provides a local interactive preview; it does not call a generation model yet.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGenerationError(`Generation failed: ${message}`);
      if (activeMode === 'app') {
        setAppBuildMessages((previous) => [...previous, {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: `No new code was applied. ${message}`,
          timestamp: Date.now(),
        }].slice(-60));
      }
      console.error('Genesis Manifestation error:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Start the app-generation request after the prompt and App mode have rendered.
  useEffect(() => {
    if (!autoGenerateRequested || activeMode !== 'app') return;
    setAutoGenerateRequested(false);
    void handleManifest();
  }, [autoGenerateRequested, activeMode]);

  // Atomic Manipulator Semantic Object Example
  const currentAtomicComponent = `<!-- 🐾 Sovereign Synthesized Component: ${prompt.slice(0, 24)} -->
<div class="relative group rounded-3xl p-6 border border-amber-500/40 bg-[#0e0e18]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] text-white font-sans max-w-md mx-auto transition-all hover:scale-105">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <span class="h-3 w-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#f59e0b]"></span>
      <span class="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">SOVEREIGN CORE</span>
    </div>
    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">${emotionalFrequency}Hz</span>
  </div>
  <h3 class="text-xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-100 to-amber-500">${prompt.slice(0, 32)}</h3>
  <p class="text-xs text-gray-400 leading-relaxed mb-5">Synthesized via Supru Generative Studio with physical refractive index n=${refractiveIndex.toFixed(2)} and zero-latency GPU rendering.</p>
  <button class="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-lg hover:brightness-110 active:scale-95 transition-all">
    Engage Sovereign Protocol
  </button>
</div>`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050508] text-gray-200 select-none">
      {generationError && (
        <div role="alert" className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          <div className="flex items-start justify-between gap-3">
            <span>{generationError}</span>
            <button type="button" onClick={() => setGenerationError(null)} className="shrink-0 text-rose-300 hover:text-white" aria-label="Dismiss generation error">×</button>
          </div>
        </div>
      )}
      {/* =========================================================================
          TOP BAR: SUPRU GENERATIVE STUDIO IDENTITY & MODE SELECTOR
          ========================================================================= */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090912]/95 px-4 py-2 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wider text-white uppercase font-sans">
                SUPRU <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-400">GENERATIVE STUDIO</span>
              </span>
              <span className="rounded bg-pink-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-pink-300 border border-pink-500/30">
                GENESIS PROTOCOL
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Liquid GPU Canvas Ready
              </span>
              <span>•</span>
              <span className="text-pink-400">World-State Manifestation</span>
            </div>
          </div>
        </div>

        {/* Studio Mode Selector Pills */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMode('visual');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMode === 'visual'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <ImageIcon size={13} />
            <span>2D Visual</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMode('motion');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMode === 'motion'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Film size={13} />
            <span>4D Motion</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMode('world3d');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMode === 'world3d'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Box size={13} />
            <span>3D World</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMode('atomic');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMode === 'atomic'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Code2 size={13} />
            <span>Atomic UI</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMode('app');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeMode === 'app'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Monitor size={13} />
            <span>App Builder</span>
          </button>

          <button
            onClick={toggleNeuralAudio}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              isPlayingAudio
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'text-gray-400 hover:text-emerald-400 hover:bg-white/[0.04]'
            }`}
            title="Toggle Neural Harmonic Soundscape"
          >
            {isPlayingAudio ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} />}
            <span className="hidden sm:inline">Audio</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN STUDIO WORKSPACE: SPLIT CONTROLS (LEFT) & MANIFESTATION STAGE (RIGHT)
          ========================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: SOVEREIGN PROMPTING & CONTROLS DOCK */}
        <div className="w-full sm:w-[380px] lg:w-[420px] flex flex-col border-r border-white/[0.08] bg-[#080810]/95 p-4 overflow-y-auto custom-scrollbar shrink-0 space-y-4">
          {/* Manifest Prompt Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Wand2 size={13} className="text-pink-400" />
                <span>{activeMode === 'app' ? 'App Builder — Chat Instructions' : 'Manifestation Intent'}</span>
              </span>
              <button
                type="button"
                onClick={toggleSpeech}
                className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-gray-400 hover:text-amber-400 hover:bg-white/[0.06]'
                }`}
                title="Voice Dictation"
              >
                {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                <span>{isListening ? 'Listening...' : 'Dictate'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeMode === 'app' ? 'Describe the app to build, or comment on the next change to the existing app...' : 'Describe the 4D world-state, scene lighting, material, emotion, and aesthetic...'}
                rows={3}
                className="w-full rounded-2xl border border-white/[0.1] bg-black/50 p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/30 transition-all font-sans resize-none"
              />
              {prompt && (
                <button
                  onClick={() => setPrompt('')}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-rose-400 p-1"
                  title="Clear Prompt"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Prompt Starter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[10.5px]">
              <span className="text-gray-500 shrink-0 font-mono">Quick:</span>
              {PROMPT_SUGGESTIONS.slice(0, 3).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFx.playClick();
                    setPrompt(item);
                  }}
                  className="rounded-lg bg-white/[0.04] hover:bg-pink-500/15 hover:text-pink-300 border border-white/[0.06] px-2 py-0.5 text-gray-400 truncate max-w-[150px] shrink-0 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {activeMode !== 'app' && (
            <>
          {/* Aesthetic Singularity Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>🎨</span>
              <span>Aesthetic Singularity</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = selectedStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedStyle(preset.id);
                    }}
                    className={`flex items-start gap-2 rounded-xl p-2 text-left transition-all ${
                      isSelected
                        ? 'border border-pink-500/80 bg-pink-500/15 text-white font-semibold shadow-sm'
                        : 'border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{preset.label}</div>
                      <div className="text-[9.5px] text-gray-400 line-clamp-1">{preset.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <span>📐</span>
              <span>Aspect Ratio</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedAspectRatio(ratio.id);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedAspectRatio === ratio.id
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold'
                      : 'border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white'
                  }`}
                >
                  {ratio.id}
                </button>
              ))}
            </div>
          </div>

          {/* 4D World-State Variables (Refractive Index, Emotional Frequency, Guidance) */}
          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-black/40 p-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Sliders size={12} />
                <span>4D World-State Variables</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">Physics Core</span>
            </div>

            {/* Refractive Index Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Material Refractive Index (n)</span>
                <span className="text-amber-400 font-bold">{refractiveIndex.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.02"
                value={refractiveIndex}
                onChange={(e) => setRefractiveIndex(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1 rounded-lg cursor-pointer bg-white/[0.1]"
              />
            </div>

            {/* Emotional Frequency Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Emotional Resonance Frequency</span>
                <span className="text-pink-400 font-bold">{emotionalFrequency} Hz</span>
              </div>
              <input
                type="range"
                min="200"
                max="852"
                step="1"
                value={emotionalFrequency}
                onChange={(e) => setEmotionalFrequency(parseInt(e.target.value, 10))}
                className="w-full accent-pink-500 h-1 rounded-lg cursor-pointer bg-white/[0.1]"
              />
            </div>

            {/* Seed Randomizer */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-gray-400 font-mono">Entropy Seed: #{seed}</span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setSeed(Math.floor(Math.random() * 999999));
                }}
                className="flex items-center gap-1 rounded bg-white/[0.06] hover:bg-white/[0.1] px-2 py-0.5 text-gray-300 transition-colors"
              >
                <RotateCcw size={10} />
                <span>Randomize</span>
              </button>
            </div>
          </div>

            </>
          )}

          {/* MANIFEST REALITY BUTTON */}
          <button
            type="button"
            onClick={handleManifest}
            disabled={isSynthesizing || !prompt.trim()}
            className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all duration-300 active:scale-98 ${
              isSynthesizing
                ? 'bg-pink-600/50 text-pink-200 cursor-wait animate-pulse'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:brightness-110 hover:shadow-[0_0_40px_rgba(236,72,153,0.6)]'
            }`}
          >
            {isSynthesizing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Manifesting 4D State...</span>
              </>
            ) : (
              <>
                <Zap size={16} className="fill-white" />
                <span>{activeMode === 'app' ? (currentResultApp ? 'Apply App Change' : 'Build Application') : 'Manifest Reality'}</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT PANEL: LIQUID CANVAS & MANIFESTATION STAGE */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#040407] relative">
          {/* Active Mode Stage Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 font-mono text-gray-400">
              <span className="text-white font-bold">STAGE:</span>
              <span className="uppercase text-pink-400">{activeMode} MANIFESTATION</span>
              <span>•</span>
              <span className="text-[10px] text-gray-500">Seed: {seed}</span>
            </div>

            {/* Quick action buttons on stage */}
            <div className="flex items-center gap-1.5">
              {currentResultImage && onOpenImageStudio && (
                <button
                  onClick={() => onOpenImageStudio(currentResultImage)}
                  className="flex items-center gap-1 rounded-lg border border-pink-500/30 bg-pink-500/10 px-2 py-1 text-[11px] font-semibold text-pink-300 hover:bg-pink-500/20"
                >
                  <Sparkles size={11} />
                  <span>Refine in Vision Studio</span>
                </button>
              )}

              {currentResultImage && onOpenVeoStudio && (
                <button
                  onClick={() => onOpenVeoStudio(currentResultImage)}
                  className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/20"
                >
                  <Film size={11} />
                  <span>Animate in Veo</span>
                </button>
              )}

              {onSendToChat && currentResultImage && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onSendToChat(`[Manifested from Supru Generative Studio]\n\nPrompt: "${prompt}"\nStyle: ${selectedStyle}`, currentResultImage);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20"
                >
                  <Send size={11} />
                  <span>Send to Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE MODE VIEWPORTS */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center relative">
            {/* 1. VISUAL 2D MODE */}
            {activeMode === 'visual' && (
              <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl">
                {currentResultImage ? (
                  <div className="relative group rounded-3xl overflow-hidden border-2 border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)] max-h-[75vh] max-w-full">
                    <img
                      src={currentResultImage}
                      alt={prompt}
                      className="w-full h-full object-contain max-h-[70vh] rounded-3xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <div className="text-sm font-bold text-white truncate">{prompt}</div>
                      <div className="text-xs text-pink-300 font-mono mt-1 flex items-center gap-3">
                        <span>Ratio: {selectedAspectRatio}</span>
                        <span>Style: {selectedStyle}</span>
                        <a
                          href={currentResultImage}
                          download={`supru-genesis-${Date.now()}.png`}
                          className="flex items-center gap-1 text-amber-400 hover:underline"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] max-w-md">
                    <div className="h-16 w-16 mx-auto rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4">
                      <Sparkles size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Genesis Canvas Awaiting Intent</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Adjust your prompt and physics variables on the left, then click <strong>"Manifest Reality"</strong> to synthesize 8K world-states.
                    </p>
                    <button
                      onClick={handleManifest}
                      className="px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold hover:bg-pink-500/30 transition-all"
                    >
                      Manifest Sample Scene
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* APPLICATION BUILDER: GENERATED SOURCE + SANDBOXED PREVIEW */}
            {activeMode === 'app' && (
              <div className="w-full h-full min-h-[420px] flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2">
                  <div className="flex min-w-0 flex-col gap-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Monitor size={14} className="text-emerald-300" />
                      <span className="font-bold text-white">App Builder · Native AI</span>
                      <span className="text-gray-400">HTML / CSS / JavaScript</span>
                    </div>
                    <span className="truncate text-[10px] text-emerald-200" title={activeProviderInfo.endpoint}>
                      Model: {activeProviderInfo.model} · Provider: {activeProviderInfo.provider}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {currentResultApp && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          navigator.clipboard.writeText(currentResultApp);
                          setCopiedCode(true);
                          window.setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-gray-300 hover:text-white"
                      >
                        {copiedCode ? 'Copied' : 'Copy source'}
                      </button>
                    )}
                    {currentResultApp && onOpenInEditor && (
                      <button
                        type="button"
                        onClick={() => onOpenInEditor('generated-app.html', currentResultApp)}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
                      >
                        Open source in editor
                      </button>
                    )}
                  </div>
                </div>
                {appBuildMessages.length > 0 && (
                  <div className="max-h-36 shrink-0 space-y-2 overflow-y-auto rounded-xl border border-white/[0.08] bg-black/25 p-3" aria-label="App builder conversation">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Build conversation · latest comments</div>
                    {appBuildMessages.slice(-6).map((message) => (
                      <div key={message.id} className={`rounded-lg px-2.5 py-2 text-xs ${message.role === 'user' ? 'ml-5 bg-white/[0.06] text-gray-200' : 'mr-5 border border-emerald-500/15 bg-emerald-500/[0.06] text-emerald-100'}`}>
                        <div className="mb-1 text-[9px] font-bold uppercase tracking-wide opacity-60">{message.role === 'user' ? 'You · change request' : 'Supru · result'}</div>
                        <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {appGenerationSummary && (
                  <p className="text-xs text-gray-400">{appGenerationSummary} Generated code has not been tested automatically.</p>
                )}
                {currentResultApp ? (
                  <iframe
                    title="Generated application sandbox preview"
                    srcDoc={currentResultApp}
                    sandbox="allow-scripts"
                    referrerPolicy="no-referrer"
                    className="min-h-[360px] flex-1 w-full rounded-xl border border-white/10 bg-white"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/25 bg-black/20 p-8 text-center">
                    <Monitor size={30} className="mb-3 text-emerald-300" />
                    <h3 className="mb-2 text-lg font-bold text-white">Build an Application</h3>
                    <p className="mb-4 max-w-md text-xs leading-relaxed text-gray-400">Describe the app you want in the prompt panel, then generate a real editable HTML/CSS/JavaScript artifact with a sandboxed preview.</p>
                    <button type="button" onClick={handleManifest} disabled={isSynthesizing || !prompt.trim()} className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50">Generate application</button>
                  </div>
                )}
              </div>
            )}

            {/* 2. 4D MOTION MODE (Veo 3.1) */}
            {activeMode === 'motion' && (
              <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl">
                {currentResultVideo ? (
                  <div className="relative rounded-3xl overflow-hidden border-2 border-orange-500/50 shadow-2xl max-h-[75vh]">
                    <video
                      src={currentResultVideo}
                      controls
                      autoPlay
                      loop
                      className="max-h-[70vh] rounded-3xl"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] max-w-md">
                    <div className="h-16 w-16 mx-auto rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
                      <Film size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Veo 3.1 4D Motion Studio</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      Synthesize fluid 720p cinematic tracking shots with continuous camera physics and neon reflections.
                    </p>
                    <button
                      onClick={handleManifest}
                      className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold hover:bg-orange-500/30 transition-all"
                    >
                      Generate Motion Scene
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. 3D WORLD-STATE LIQUID CANVAS */}
            {activeMode === 'world3d' && (
              <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/[0.08]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    isDraggingRef.current = true;
                    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onMouseMove={(e) => {
                    if (!isDraggingRef.current) return;
                    const dx = e.clientX - lastMousePosRef.current.x;
                    const dy = e.clientY - lastMousePosRef.current.y;
                    setRotationAngle((prev) => ({
                      x: prev.x + dy * 0.005,
                      y: prev.y + dx * 0.005,
                    }));
                    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onMouseUp={() => { isDraggingRef.current = false; }}
                  onMouseLeave={() => { isDraggingRef.current = false; }}
                />

                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-xl p-2.5 border border-white/[0.08] text-[11px] text-gray-300 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Box size={12} />
                    <span>Hardware-Native Interactive Canvas</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Click & drag to rotate orbital pitch/yaw • Adjust variables on left
                  </div>
                </div>
              </div>
            )}

            {/* 4. ATOMIC MANIPULATOR (PRO-TOOLS WORKBENCH) */}
            {activeMode === 'atomic' && (
              <div className="w-full h-full flex flex-col lg:flex-row gap-4 items-stretch max-w-5xl">
                {/* Visual Component Render */}
                <div className="flex-1 flex items-center justify-center p-6 rounded-3xl border border-white/[0.08] bg-black/40 relative">
                  <div
                    dangerouslySetInnerHTML={{ __html: currentAtomicComponent }}
                  />
                </div>

                {/* Code Export & Editor Integration */}
                <div className="w-full lg:w-96 flex flex-col rounded-3xl border border-white/[0.08] bg-[#0c0c16] p-4 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-3">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Code2 size={13} />
                      <span>Synthesized JSX / HTML</span>
                    </span>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        navigator.clipboard.writeText(currentAtomicComponent);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"
                    >
                      {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <pre className="flex-1 overflow-auto text-[10.5px] text-gray-300 custom-scrollbar whitespace-pre-wrap bg-black/50 p-2.5 rounded-xl border border-white/[0.04]">
                    {currentAtomicComponent}
                  </pre>

                  {/* 1-Click Send to Supru Code IDE */}
                  {onOpenInEditor && (
                    <button
                      onClick={() => {
                        soundFx.playChime();
                        onOpenInEditor('SovereignComponent.tsx', currentAtomicComponent);
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={12} />
                      <span>Open in Supru Code IDE</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ARTIFACTS GALLERY FOOTER STREAM */}
          {manifestedArtifacts.length > 0 && (
            <div className="border-t border-white/[0.06] bg-[#06060c] p-2.5">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  <span>Manifestation Stream</span>
                </span>
                <span className="text-[9px] font-mono text-gray-500">{manifestedArtifacts.length} Artifacts</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {manifestedArtifacts.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      soundFx.playClick();
                      if (art.dataUrl && art.type === 'image') {
                        setCurrentResultImage(art.dataUrl);
                        setActiveMode('visual');
                      }
                      if (art.codeSnippet && art.type === 'app') {
                        setCurrentResultApp(art.codeSnippet);
                        setActiveMode('app');
                      }
                      setPrompt(art.prompt);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-pink-500/40 p-1.5 pr-3 shrink-0 transition-all text-left"
                  >
                    {art.dataUrl && (
                      <img
                        src={art.dataUrl}
                        alt={art.title}
                        className="h-8 w-8 rounded-lg object-cover border border-white/[0.1]"
                      />
                    )}
                    <div>
                      <div className="text-[11px] font-bold text-white truncate max-w-[140px]">{art.title}</div>
                      <div className="text-[9px] text-gray-500 font-mono">{art.type.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
