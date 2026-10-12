import React, { useState, useRef, useEffect } from 'react';
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
  Key,
  AlertCircle,
  X
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { useSpeechListener } from '../../utils/useSpeechListener';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { getProviderMeta, FREE_MODEL_PRESETS } from '../../lib/providers';
import type { LocalHostConfig, ExternalAIModelConfig } from '../../types/workbench';
import { logger } from '../../utils/logger';
import { sanitizeHtml } from '../../utils/sanitize';
import { copyText } from '../../utils/clipboard';

interface SupruGenerativeStudioViewProps {
  onSendToChat?: (content: string, imageUrl?: string) => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onRunInTerminal?: (cmd: string) => void;
  onOpenImageStudio?: (imageUrl?: string) => void;
  onOpenVeoStudio?: (imageUrl?: string) => void;
  localConfig?: LocalHostConfig;
  activeCustomModel?: ExternalAIModelConfig | null;
}

interface StudioTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string;
  provider?: string;
  model?: string;
  isStreaming?: boolean;
  error?: string;
}

export type GenerativeMode = 'visual' | 'motion' | 'world3d' | 'atomic' | 'audio';

interface ManifestedArtifact {
  id: string;
  type: 'image' | 'video' | 'world-state' | 'component' | 'audio';
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
  onSendToChat,
  onOpenInEditor,
  onRunInTerminal,
  onOpenImageStudio,
  onOpenVeoStudio,
  localConfig,
  activeCustomModel,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'media'>('chat');
  const [mediaMode, setMediaMode] = useState<GenerativeMode>('visual');
  const [prompt, setPrompt] = useState('');
  const [turns, setTurns] = useState<StudioTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(
    'You are Supru AI, a precise, helpful assistant inside Supru Studio. Answer clearly, use markdown when it aids readability, and include runnable code when relevant.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxOutputTokens, setMaxOutputTokens] = useState(2048);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [selectedModelKey, setSelectedModelKey] = useState('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('supru_studio_api_keys') || '{}');
    } catch {
      return {};
    }
  });

  const [selectedStyle, setSelectedStyle] = useState('sovereign-dark');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [refractiveIndex, setRefractiveIndex] = useState(1.42);
  const [emotionalFrequency, setEmotionalFrequency] = useState(432);
  const [seed, setSeed] = useState(42069);
  const [currentResultImage, setCurrentResultImage] = useState<string | null>(null);
  const [currentResultVideo, setCurrentResultVideo] = useState<string | null>(null);
  const [manifestedArtifacts, setManifestedArtifacts] = useState<ManifestedArtifact[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [worldSeed, setWorldSeed] = useState(0);
  const [generatedComponentCode, setGeneratedComponentCode] = useState<string | null>(null);
  const [atomicExplanation, setAtomicExplanation] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState({ x: 0.2, y: 0.4 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { isListening, startListening, stopListening, voiceNotice } = useSpeechListener();

  const persistKeys = (next: Record<string, string>) => {
    setApiKeys(next);
    localStorage.setItem('supru_studio_api_keys', JSON.stringify(next));
  };

  // Model picker entries: active custom model, configured local provider, then
  // the curated free/hosted presets.
  const models = React.useMemo(() => {
    const list: {
      key: string;
      label: string;
      provider: string;
      modelId: string;
      requiresKey: boolean;
      endpointUrl?: string;
      apiKey?: string;
      badge: string;
    }[] = [];

    if (activeCustomModel) {
      list.push({
        key: `custom:${activeCustomModel.id}`,
        label: `${activeCustomModel.name} · ${activeCustomModel.modelId}`,
        provider: activeCustomModel.provider,
        modelId: activeCustomModel.modelId,
        requiresKey: getProviderMeta(activeCustomModel.provider).requiresKey,
        endpointUrl: activeCustomModel.endpointUrl,
        apiKey: activeCustomModel.apiKey,
        badge: activeCustomModel.badge || 'Saved',
      });
    }

    if (localConfig && localConfig.provider !== 'gemini_cloud' && localConfig.provider !== 'offline_core') {
      const meta = getProviderMeta(localConfig.provider);
      list.push({
        key: `local:${localConfig.provider}`,
        label: `${meta.label} · ${localConfig.modelName}`,
        provider: localConfig.provider,
        modelId: localConfig.modelName,
        requiresKey: meta.requiresKey,
        endpointUrl: localConfig.endpointUrl,
        apiKey: localConfig.apiKey,
        badge: meta.badge,
      });
    }

    for (const p of FREE_MODEL_PRESETS) {
      list.push({
        key: `${p.provider}:${p.modelId}`,
        label: p.name,
        provider: p.provider,
        modelId: p.modelId,
        requiresKey: p.requiresKey,
        endpointUrl: p.endpointUrl,
        badge: p.badge,
      });
    }
    return list;
  }, [activeCustomModel, localConfig]);

  React.useEffect(() => {
    if (!selectedModelKey && models.length) {
      setSelectedModelKey(models[0].key);
    }
  }, [models, selectedModelKey]);

  const selectedModel = models.find((m) => m.key === selectedModelKey) || models[0];
  const selectedMeta = selectedModel ? getProviderMeta(selectedModel.provider) : null;
  const selectedApiKey = selectedModel
    ? apiKeys[selectedModel.provider] || selectedModel.apiKey || ''
    : '';
  const needsKey = Boolean(selectedMeta?.requiresKey && !selectedApiKey);

  const handleSpeech = () => {
    if (isListening) stopListening();
    else startListening(prompt, (t) => setPrompt(t));
  };

  // ---- Chat run: streams a real completion through the unified provider layer ----
  const handleRun = async () => {
    const text = prompt.trim();
    if (!text || isStreaming) return;
    if (!selectedModel) return;

    soundFx.playChime();
    const userTurn: StudioTurn = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    const assistantId = `a-${Date.now()}`;
    const assistantTurn: StudioTurn = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      provider: selectedModel.provider,
      model: selectedModel.modelId,
      isStreaming: true,
    };

    const history = [...turns, userTurn];
    setTurns([...history, assistantTurn]);
    setPrompt('');
    setIsStreaming(true);

    const patch = (fn: (t: StudioTurn) => StudioTurn) =>
      setTurns((prev) => prev.map((t) => (t.id === assistantId ? fn(t) : t)));

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((t) => ({ role: t.role, content: t.content })),
          persona: 'supru_cat',
          temperature,
          maxOutputTokens,
          systemInstruction: systemInstruction.trim() || undefined,
          provider: selectedModel.provider,
          modelId: selectedModel.modelId,
          apiKey: selectedApiKey || undefined,
          endpointUrl: selectedModel.endpointUrl,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.replace(/^data:\s*/, ''));
            if (data.notice) {
              patch((t) => ({ ...t, error: String(data.notice) }));
            }
            if (data.chunk) {
              accumulated += data.chunk;
              patch((t) => ({ ...t, content: accumulated }));
            }
            if (data.provider) patch((t) => ({ ...t, provider: data.provider }));
            if (data.model) patch((t) => ({ ...t, model: data.model }));
          } catch {
            /* ignore malformed frame */
          }
        }
      }
      patch((t) => ({ ...t, content: accumulated || t.content, isStreaming: false }));
    } catch (err: any) {
      patch((t) => ({
        ...t,
        isStreaming: false,
        content: t.content || 'The request failed before a response arrived.',
        error: err?.message || 'Request failed',
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  // ---- Media synthesis ----
  const handleManifest = async () => {
    const text = prompt.trim();
    if (!text || isSynthesizing) return;
    soundFx.playChime();
    setIsSynthesizing(true);
    setMediaError(null);

    try {
      if (mediaMode === 'visual') {
        const enhanced = `${text}, ${selectedStyle} style, 8k resolution, volumetric atmospheric cinematic lighting, highly detailed masterpiece`;
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: enhanced, aspectRatio: selectedAspectRatio, seed }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.imageUrl) {
          setCurrentResultImage(data.imageUrl);
          setManifestedArtifacts((prev) => [
            {
              id: `art-${Date.now()}`,
              type: 'image',
              title: text.slice(0, 36),
              prompt: text,
              dataUrl: data.imageUrl,
              timestamp: Date.now(),
              metadata: { style: selectedStyle, aspectRatio: selectedAspectRatio, seed, model: data.model },
            },
            ...prev,
          ]);
          soundFx.playChime();
        } else {
          setMediaError(data.error || `Image synthesis failed (HTTP ${res.status}). The free image service may be rate-limited — try again shortly.`);
        }
      } else if (mediaMode === 'motion') {
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: currentResultImage, prompt: text, aspectRatio: selectedAspectRatio === '9:16' ? '9:16' : '16:9' }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.videoUrl) setCurrentResultVideo(data.videoUrl);
        else if (res.ok && data.operationName) {
          // Poll the operation until it completes.
          let completed = false;
          for (let i = 0; i < 40; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const st = await fetch('/api/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: data.operationName }),
            }).then((r) => r.json()).catch(() => ({ done: true }));
            if (st.done) {
              setCurrentResultVideo(`/api/video-download?operationName=${encodeURIComponent(data.operationName)}`);
              completed = true;
              break;
            }
          }
          if (!completed) setMediaError('Video generation timed out. Please try again.');
        } else {
          setMediaError(data.error || `Video synthesis failed (HTTP ${res.status}). Veo requires a configured Gemini API key.`);
        }
      } else if (mediaMode === 'world3d') {
        // Reframe the particle manifold with the prompt + resonance and capture it.
        const nextWorldSeed = Math.floor(Math.random() * 999999);
        setWorldSeed(nextWorldSeed);
        await new Promise((r) => setTimeout(r, 260));
        const canvas = canvasRef.current;
        if (canvas) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setCurrentResultImage(dataUrl);
            setManifestedArtifacts((prev) => [
              {
                id: `art-${Date.now()}`,
                type: 'world-state',
                title: text.slice(0, 36),
                prompt: text,
                dataUrl,
                timestamp: Date.now(),
                metadata: { resonance: emotionalFrequency, refractiveIndex, seed: nextWorldSeed },
              },
              ...prev,
            ]);
            soundFx.playChime();
          } catch (captureErr) {
            logger.warn('World capture failed:', captureErr);
            setMediaError('Could not capture the 3D world-state.');
          }
        }
      } else if (mediaMode === 'atomic') {
        const res = await fetch('/api/studio/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            currentCode: '',
            language: 'html',
            modelConfig: {
              provider: selectedModel?.provider || 'gemini',
              modelId: selectedModel?.modelId,
              apiKey: selectedApiKey,
              endpointUrl: selectedModel?.endpointUrl,
            },
            settings: { systemInstruction, temperature, maxOutputTokens },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.code) {
          setGeneratedComponentCode(data.code);
          setAtomicExplanation(data.explanation || '');
          setManifestedArtifacts((prev) => [
            {
              id: `art-${Date.now()}`,
              type: 'component',
              title: text.slice(0, 36),
              prompt: text,
              dataUrl: '',
              codeSnippet: data.code,
              timestamp: Date.now(),
              metadata: { model: data.model, provider: data.provider },
            },
            ...prev,
          ]);
          soundFx.playChime();
        } else {
          setMediaError(data.error || `UI code synthesis failed (HTTP ${res.status}).`);
        }
      }
    } catch (err) {
      logger.error('Media synthesis error:', err);
      setMediaError(err instanceof Error ? err.message : 'Media synthesis failed.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const toggleNeuralAudio = () => {
    soundFx.playClick();
    if (isPlayingAudio) {
      try { oscillatorRef.current?.stop(); } catch {}
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
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
      setIsPlayingAudio(true);
    } catch (e) {
      logger.warn('Audio synthesis unavailable:', e);
    }
  };

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      try { oscillatorRef.current?.stop(); } catch {}
    };
  }, []);

  // ---- 3D world-state canvas (media tab only) ----
  React.useEffect(() => {
    if (activeTab !== 'media' || mediaMode !== 'world3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);
    const particles: Array<{ baseX: number; baseY: number; baseZ: number; color: string; size: number }> = [];
    const numParticles = 420;
    const radius = Math.min(width, height) * 0.35;
    const colors = ['#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#ffffff'];
    // Deterministic RNG so a given world seed always rebuilds the same manifold.
    let rngState = (worldSeed >>> 0) || 0x9e3779b9;
    const rand = () => {
      rngState |= 0;
      rngState = (rngState + 0x6d2b79f5) | 0;
      let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * rand() - 1);
      const phi = rand() * Math.PI * 2;
      particles.push({
        baseX: radius * Math.sin(theta) * Math.cos(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(theta),
        color: colors[i % colors.length],
        size: 1.5 + rand() * 2.5,
      });
    }

    let angleY = rotationAngle.y;
    let angleX = rotationAngle.x;
    let t = 0;
    const fov = 400;

    const render = () => {
      t += 0.015;
      angleY += 0.005;
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, radius * 1.5);
      gradient.addColorStop(0, `rgba(245, 158, 11, ${0.12 * refractiveIndex})`);
      gradient.addColorStop(0.5, `rgba(236, 72, 153, ${0.08 * (emotionalFrequency / 432)})`);
      gradient.addColorStop(1, 'rgba(6, 6, 12, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const rCurrent = 1 + (Math.sin(t + i * 0.1) * (refractiveIndex * 12)) / radius;
        const rx1 = p.baseX * rCurrent * Math.cos(angleY) + p.baseZ * rCurrent * Math.sin(angleY);
        const rz1 = -p.baseX * rCurrent * Math.sin(angleY) + p.baseZ * rCurrent * Math.cos(angleY);
        const ry2 = p.baseY * rCurrent * Math.cos(angleX) - rz1 * Math.sin(angleX);
        const rz2 = p.baseY * rCurrent * Math.sin(angleX) + rz1 * Math.cos(angleX);
        const depth = fov / (fov + rz2 + 200);
        const projX = cx + rx1 * depth;
        const projY = cy + ry2 * depth;
        const alpha = Math.max(0.15, Math.min(1, (rz2 + radius) / (radius * 2)));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(0.8, p.size * depth), 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < Math.min(i + 5, particles.length); j++) {
          const p2 = particles[j];
          const rx2 = p2.baseX * Math.cos(angleY) + p2.baseZ * Math.sin(angleY);
          const rz_2 = -p2.baseX * Math.sin(angleY) + p2.baseZ * Math.cos(angleY);
          const ry_2 = p2.baseY * Math.cos(angleX) - rz_2 * Math.sin(angleX);
          const rz_final = p2.baseY * Math.sin(angleX) + rz_2 * Math.cos(angleX);
          const depth2 = fov / (fov + rz_final + 200);
          const dist = Math.hypot(projX - (cx + rx2 * depth2), projY - (cy + ry_2 * depth2));
          if (dist < 45) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 45) * 0.3 * alpha;
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            ctx.lineTo(cx + rx2 * depth2, cy + ry_2 * depth2);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeTab, mediaMode, refractiveIndex, emotionalFrequency, rotationAngle, worldSeed]);

  const atomicPromptLabel = prompt.slice(0, 32).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)) || 'Sovereign Component';
  const defaultAtomicComponent = `<!-- 🐾 Sovereign Component: ${atomicPromptLabel} -->
<div class="rounded-3xl p-6 border border-amber-500/40 bg-[#0e0e18]/90 text-white font-sans max-w-md mx-auto">
  <div class="flex items-center justify-between mb-4">
    <span class="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">SOVEREIGN CORE</span>
    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">${emotionalFrequency}Hz</span>
  </div>
  <h3 class="text-xl font-black mb-2">${atomicPromptLabel}</h3>
  <p class="text-xs text-gray-400 leading-relaxed mb-5">Synthesized in Supru Studio · refractive n=${refractiveIndex.toFixed(2)}</p>
  <button class="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950">Engage Protocol</button>
</div>`;

  // Use AI-generated code when available, otherwise the built-in scaffold.
  const atomicComponent = generatedComponentCode || defaultAtomicComponent;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050508] text-gray-200 select-none">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] bg-[#090912]/95 px-3 sm:px-4 py-2 backdrop-blur-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide text-white truncate">
                Supru <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-400">AI Studio</span>
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate">
              {selectedMeta ? `${selectedMeta.label} · ${selectedModel?.modelId}` : 'Select a model'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedModelKey}
            onChange={(e) => { soundFx.playClick(); setSelectedModelKey(e.target.value); }}
            className="hidden sm:block max-w-[220px] rounded-xl border border-white/[0.08] bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-pink-500/60"
            title="Choose model"
          >
            {models.map((m) => (
              <option key={m.key} value={m.key} className="bg-[#101018]">
                {m.label} — {m.badge}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              soundFx.playClick();
              const snippet = `// Supru AI Studio — integration snippet\nfetch('/api/studio/chat', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    messages: [{ role: 'user', content: 'Hello' }],\n    provider: '${selectedModel?.provider}',\n    modelId: '${selectedModel?.modelId}',\n  }),\n});`;
              copyText(snippet);
              if (onOpenInEditor) onOpenInEditor('supru-studio-client.ts', snippet);
            }}
            className="hidden sm:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Generate client code for this Studio configuration"
          >
            <Code2 size={13} />
            <span>Get code</span>
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/40 p-1">
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('chat'); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'chat' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Send size={13} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => { soundFx.playClick(); setActiveTab('media'); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'media' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <ImageIcon size={13} />
              <span>Media</span>
            </button>
          </div>
          <button
            onClick={() => { soundFx.playClick(); setSettingsOpen((v) => !v); }}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
              settingsOpen ? 'border-pink-500/40 bg-pink-500/15 text-pink-300' : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-white'
            }`}
            title="Toggle Run settings"
          >
            <Sliders size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ================= MAIN ================= */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                  {turns.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-amber-500/20 border border-pink-500/30 text-pink-300">
                        <Sparkles size={26} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Start creating with Supru AI Studio</h2>
                        <p className="mt-1 text-xs text-gray-400 max-w-md">
                          Pick a model in Run settings, then type a prompt below. Free models work with no API key.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                        {PROMPT_SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => { soundFx.playClick(); setPrompt(s); textareaRef.current?.focus(); }}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] text-gray-400 hover:border-pink-500/40 hover:text-pink-200 transition-colors max-w-[280px] truncate"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {turns.map((turn) => (
                    <div key={turn.id} className={`flex gap-3 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {turn.role === 'assistant' && (
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                          <Sparkles size={14} />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        turn.role === 'user'
                          ? 'bg-gradient-to-br from-pink-600/25 to-rose-600/15 border border-pink-500/30 text-white'
                          : 'bg-white/[0.03] border border-white/[0.08] text-gray-100'
                      }`}>
                        {turn.role === 'assistant' && turn.error && (
                          <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10.5px] text-amber-300">
                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                            <span className="break-words">{turn.error}</span>
                          </div>
                        )}
                        {turn.role === 'assistant' ? (
                          turn.content ? (
                            <MarkdownRenderer content={turn.content} onOpenInEditor={onOpenInEditor ? (code) => onOpenInEditor('snippet.txt', code) : undefined} />
                          ) : (
                            <span className="flex items-center gap-2 text-xs text-gray-500">
                              <RefreshCw size={12} className="animate-spin" />
                              Generating…
                            </span>
                          )
                        ) : (
                          <span className="whitespace-pre-wrap">{turn.content}</span>
                        )}
                        {turn.role === 'assistant' && !turn.isStreaming && turn.content && (
                          <div className="mt-2 flex items-center gap-2 border-t border-white/[0.06] pt-2 text-[10px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Check size={11} />
                              {turn.provider}{turn.model ? ` · ${turn.model}` : ''}
                            </span>
                            <button
                              onClick={() => { copyText(turn.content); soundFx.playClick(); }}
                              className="ml-auto flex items-center gap-1 hover:text-white"
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Input dock */}
              <div className="border-t border-white/[0.08] bg-[#080810] p-3">
                <div className="mx-auto w-full max-w-3xl">
                  <div className="rounded-2xl border border-white/[0.1] bg-black/40 p-2 focus-within:border-pink-500/50 transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleRun();
                        }
                      }}
                      placeholder="Ask Supru anything, or describe what you want to build…  (Shift+Enter for a new line)"
                      rows={2}
                      className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder-gray-500 outline-none"
                    />
                    <div className="flex items-center justify-between gap-2 px-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleSpeech}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                            isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-gray-400 hover:text-amber-400 hover:bg-white/[0.06]'
                          }`}
                          title="Voice dictation"
                        >
                          {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                          <span>{isListening ? 'Listening…' : 'Dictate'}</span>
                        </button>
                        {voiceNotice && <span className="text-[10px] text-gray-500">{voiceNotice}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {needsKey && selectedMeta && (
                          <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-400">
                            <Key size={11} /> {selectedMeta.label} key needed
                          </span>
                        )}
                        <button
                          onClick={handleRun}
                          disabled={isStreaming || !prompt.trim() || needsKey}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {isStreaming ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                          <span>{isStreaming ? 'Running…' : 'Run'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ================= MEDIA TAB ================= */
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-1 border-b border-white/[0.06] bg-black/30 px-4 py-2">
                {([
                  { id: 'visual', label: 'Image', icon: <ImageIcon size={13} /> },
                  { id: 'motion', label: 'Video', icon: <Film size={13} /> },
                  { id: 'world3d', label: '3D World', icon: <Box size={13} /> },
                  { id: 'atomic', label: 'UI Code', icon: <Code2 size={13} /> },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { soundFx.playClick(); setMediaMode(m.id); }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      mediaMode === m.id ? 'bg-white/[0.08] text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-1 flex-col overflow-auto p-4">
                {(mediaMode === 'visual' || mediaMode === 'motion') && (
                  <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STYLE_PRESETS.slice(0, 4).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => { soundFx.playClick(); setSelectedStyle(preset.id); }}
                          className={`rounded-xl border p-2 text-left transition-all ${
                            selectedStyle === preset.id ? 'border-pink-500/70 bg-pink-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-white truncate">{preset.icon} {preset.label}</div>
                          <div className="text-[9.5px] text-gray-500 line-clamp-1">{preset.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { soundFx.playClick(); setSelectedAspectRatio(r.id); }}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            selectedAspectRatio === r.id ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold' : 'border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white'
                          }`}
                        >
                          {r.id}
                        </button>
                      ))}
                    </div>

                    <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/[0.08] bg-black/40 p-4">
                      {mediaMode === 'visual' && currentResultImage ? (
                        <img src={currentResultImage} alt={prompt} className="max-h-[60vh] rounded-xl object-contain" />
                      ) : mediaMode === 'motion' && currentResultVideo ? (
                        <video src={currentResultVideo} controls autoPlay loop className="max-h-[60vh] rounded-xl" />
                      ) : (
                        <div className="text-center">
                          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
                            {mediaMode === 'visual' ? <ImageIcon size={26} /> : <Film size={26} />}
                          </div>
                          <p className="text-xs text-gray-400">
                            {mediaMode === 'visual' ? 'Describe an image below, then press Generate.' : 'Generate an image first, then animate it into motion.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {mediaError && (
                      <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11.5px] text-rose-200">
                        <span className="mt-[1px] shrink-0 font-bold">⚠</span>
                        <span className="break-words">{mediaError}</span>
                        <button
                          onClick={() => setMediaError(null)}
                          className="ml-auto shrink-0 text-rose-300/70 hover:text-white"
                          aria-label="Dismiss error"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    {currentResultImage && (
                      <div className="flex flex-wrap items-center gap-2">
                        {onOpenImageStudio && (
                          <button onClick={() => onOpenImageStudio(currentResultImage)} className="flex items-center gap-1 rounded-lg border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[11px] font-semibold text-pink-300 hover:bg-pink-500/20">
                            <Sparkles size={11} /> Refine in Vision Studio
                          </button>
                        )}
                        {onOpenVeoStudio && (
                          <button onClick={() => onOpenVeoStudio(currentResultImage)} className="flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-300 hover:bg-orange-500/20">
                            <Film size={11} /> Animate in Veo
                          </button>
                        )}
                        <a href={currentResultImage} download={`supru-${Date.now()}.png`} className="flex items-center gap-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] text-gray-300 hover:text-white">
                          <Download size={11} /> Download
                        </a>
                        {onSendToChat && (
                          <button onClick={() => onSendToChat(`[From Supru Studio]\n\nPrompt: "${prompt}"`, currentResultImage)} className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20">
                            <Send size={11} /> Send to Chat
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {mediaMode === 'world3d' && (
                  <div className="relative flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-white/[0.08]">
                    <canvas
                      ref={canvasRef}
                      className="h-full w-full cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => { isDraggingRef.current = true; lastMousePosRef.current = { x: e.clientX, y: e.clientY }; }}
                      onMouseMove={(e) => {
                        if (!isDraggingRef.current) return;
                        const dx = e.clientX - lastMousePosRef.current.x;
                        const dy = e.clientY - lastMousePosRef.current.y;
                        setRotationAngle((prev) => ({ x: prev.x + dy * 0.005, y: prev.y + dx * 0.005 }));
                        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                      }}
                      onMouseUp={() => { isDraggingRef.current = false; }}
                      onMouseLeave={() => { isDraggingRef.current = false; }}
                    />
                    <div className="absolute bottom-3 left-3 rounded-xl border border-white/[0.08] bg-black/70 p-2.5 text-[11px] text-gray-300 backdrop-blur-md">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-400"><Box size={12} /> Interactive particle manifold</div>
                      <div className="text-[10px] text-gray-500">Drag to rotate · tune physics in Run settings</div>
                    </div>
                  </div>
                )}

                {mediaMode === 'atomic' && (
                  <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:flex-row">
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-black/40 p-6">
                      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(atomicComponent) }} />
                      {atomicExplanation && (
                        <p className="max-w-md text-center text-[11px] leading-relaxed text-gray-400">{atomicExplanation}</p>
                      )}
                    </div>
                    <div className="flex w-full flex-col rounded-2xl border border-white/[0.08] bg-[#0c0c16] p-4 text-xs font-mono lg:w-96">
                      <div className="mb-3 flex items-center justify-between border-b border-white/[0.06] pb-2">
                        <span className="flex items-center gap-1.5 font-bold text-purple-400">
                          <Code2 size={13} /> {generatedComponentCode ? 'AI-generated HTML' : 'Generated HTML'}
                        </span>
                        <button
                          onClick={() => { copyText(atomicComponent); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}
                          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"
                        >
                          {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="flex-1 overflow-auto whitespace-pre-wrap rounded-xl border border-white/[0.04] bg-black/50 p-2.5 text-[10.5px] text-gray-300 custom-scrollbar">{atomicComponent}</pre>
                      {generatedComponentCode && (
                        <button
                          onClick={() => { soundFx.playClick(); setGeneratedComponentCode(null); setAtomicExplanation(''); }}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 font-bold text-gray-300 hover:text-white"
                        >
                          <RotateCcw size={12} /> Reset to scaffold
                        </button>
                      )}
                      {onOpenInEditor && (
                        <button
                          onClick={() => { soundFx.playChime(); onOpenInEditor('SovereignComponent.html', atomicComponent); }}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/20 py-2 font-bold text-purple-300 hover:bg-purple-500/30"
                        >
                          <ExternalLink size={12} /> Open in Supru Code IDE
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {manifestedArtifacts.length > 0 && (
                <div className="border-t border-white/[0.06] bg-[#06060c] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-gray-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-400" /> Recent generations
                    </span>
                    <span className="text-[9px] font-mono text-gray-500">{manifestedArtifacts.length}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {manifestedArtifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => {
                          soundFx.playClick();
                          setPrompt(art.prompt);
                          if (art.type === 'component' && art.codeSnippet) {
                            setGeneratedComponentCode(art.codeSnippet);
                            setMediaMode('atomic');
                          } else if (art.dataUrl) {
                            setCurrentResultImage(art.dataUrl);
                            setMediaMode(art.type === 'video' ? 'motion' : 'visual');
                          }
                        }}
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1.5 pr-3 text-left transition-all hover:border-pink-500/40 hover:bg-white/[0.06]"
                      >
                        {art.dataUrl && <img src={art.dataUrl} alt={art.title} className="h-8 w-8 rounded-lg border border-white/[0.1] object-cover" />}
                        <div>
                          <div className="max-w-[140px] truncate text-[11px] font-bold text-white">{art.title}</div>
                          <div className="text-[9px] font-mono text-gray-500">{art.type.toUpperCase()}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ================= RUN SETTINGS PANEL ================= */}
        {settingsOpen && (
          <aside className="hidden w-[320px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/[0.08] bg-[#080810]/95 p-4 custom-scrollbar md:flex">
            <div className="text-xs font-bold uppercase tracking-wider text-pink-400">Run settings</div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
                <Cpu size={12} /> Model
              </label>
              <select
                value={selectedModelKey}
                onChange={(e) => { soundFx.playClick(); setSelectedModelKey(e.target.value); }}
                className="w-full rounded-xl border border-[#2b2b3c] bg-[#101018] px-3 py-2 text-xs text-white outline-none focus:border-pink-500/60"
              >
                {models.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} — {m.badge}
                  </option>
                ))}
              </select>
              {selectedMeta?.freeTier && (
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300">
                  <Zap size={11} /> Free to use{selectedMeta.requiresKey ? ' (API key required)' : ' · no API key required'}
                </div>
              )}
            </div>

            {/* API key when required */}
            {selectedMeta?.requiresKey && selectedModel && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-300">
                  <Key size={12} /> {selectedMeta.label} API key
                </label>
                <input
                  type="password"
                  value={apiKeys[selectedModel.provider] || ''}
                  onChange={(e) => persistKeys({ ...apiKeys, [selectedModel.provider]: e.target.value })}
                  placeholder={selectedMeta.keyPlaceholder || 'sk-...'}
                  className="w-full rounded-xl border border-[#2b2b3c] bg-[#101018] px-3 py-2 font-mono text-xs text-white outline-none focus:border-pink-500/60"
                />
                {selectedMeta.docsUrl && (
                  <a href={selectedMeta.docsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-pink-400 hover:underline">
                    <ExternalLink size={10} /> Get a free key
                  </a>
                )}
              </div>
            )}

            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                <span className="flex items-center gap-1.5"><Sliders size={12} /> Temperature</span>
                <span className="font-mono text-pink-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="2" step="0.05" value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="h-1 w-full cursor-pointer rounded-lg bg-white/[0.1] accent-pink-500"
              />
            </div>

            {/* Max output tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-300">
                <span>Max output tokens</span>
                <span className="font-mono text-pink-400">{maxOutputTokens}</span>
              </div>
              <input
                type="range" min="256" max="8192" step="256" value={maxOutputTokens}
                onChange={(e) => setMaxOutputTokens(parseInt(e.target.value, 10))}
                className="h-1 w-full cursor-pointer rounded-lg bg-white/[0.1] accent-pink-500"
              />
            </div>

            {/* System instructions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-300">System instructions</label>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-[#2b2b3c] bg-[#101018] p-2.5 text-[11px] text-gray-200 outline-none focus:border-pink-500/60"
              />
            </div>

            {activeTab === 'media' && (
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-black/30 p-3">
                <div className="text-[11px] font-bold text-amber-300">
                  {mediaMode === 'world3d'
                    ? 'Physics (3D world)'
                    : mediaMode === 'atomic'
                    ? 'Generation settings'
                    : 'Synthesis parameters'}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px] font-mono text-gray-400">
                    <span>Refractive index</span><span className="text-amber-400">{refractiveIndex.toFixed(2)}</span>
                  </div>
                  <input type="range" min="1" max="2.5" step="0.02" value={refractiveIndex} onChange={(e) => setRefractiveIndex(parseFloat(e.target.value))} className="h-1 w-full cursor-pointer rounded-lg bg-white/[0.1] accent-amber-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px] font-mono text-gray-400">
                    <span>Resonance</span><span className="text-pink-400">{emotionalFrequency} Hz</span>
                  </div>
                  <input type="range" min="200" max="852" step="1" value={emotionalFrequency} onChange={(e) => setEmotionalFrequency(parseInt(e.target.value, 10))} className="h-1 w-full cursor-pointer rounded-lg bg-white/[0.1] accent-pink-500" />
                </div>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-mono text-gray-400">Seed #{seed}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { soundFx.playClick(); setSeed(Math.floor(Math.random() * 999999)); if (mediaMode === 'world3d') setWorldSeed(Math.floor(Math.random() * 999999)); }} className="flex items-center gap-1 rounded bg-white/[0.06] px-2 py-0.5 text-gray-300 hover:bg-white/[0.1]">
                      <RotateCcw size={10} /> Randomize
                    </button>
                    <button onClick={toggleNeuralAudio} className={`flex items-center gap-1 rounded px-2 py-0.5 ${isPlayingAudio ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]'}`} title="Toggle resonance tone">
                      {isPlayingAudio ? <Volume2 size={10} /> : <VolumeX size={10} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Media generate dock */}
      {activeTab === 'media' && (
        <div className="border-t border-white/[0.08] bg-[#080810] p-3">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleManifest(); }}
              placeholder={
                mediaMode === 'visual'
                  ? 'Describe the image you want to generate…'
                  : mediaMode === 'motion'
                  ? 'Describe the motion / camera move for the video…'
                  : mediaMode === 'world3d'
                  ? 'Describe the 3D world-state, then press Generate to rebuild it…'
                  : 'Describe the UI component you want the AI to build…'
              }
              className="flex-1 rounded-xl border border-white/[0.1] bg-black/40 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
            />
            <button
              onClick={handleManifest}
              disabled={isSynthesizing || !prompt.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSynthesizing ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
              <span>
                {isSynthesizing
                  ? 'Generating…'
                  : mediaMode === 'atomic'
                  ? 'Generate code'
                  : 'Generate'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
