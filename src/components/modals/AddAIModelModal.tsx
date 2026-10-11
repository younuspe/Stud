import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Server, 
  Key, 
  Globe, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Check, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Radio
} from 'lucide-react';
import { ExternalAIModelConfig } from '../../types/workbench';
import { FREE_MODEL_PRESETS, PROVIDER_CATALOG, PROVIDER_ORDER, getProviderMeta } from '../../lib/providers';
import { soundFx } from '../../utils/audio';

interface AddAIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: ExternalAIModelConfig, makeActive?: boolean) => void;
  onSelectModel: (model: ExternalAIModelConfig) => void;
  onDeleteModel?: (id: string) => void;
  existingModels: ExternalAIModelConfig[];
  activeModelId?: string;
}

// Quick 1-click presets: free hosted models (NVIDIA NIM, Groq, OpenRouter, ...)
// followed by a couple of popular paid cloud options.
const MODEL_PRESETS = [
  ...FREE_MODEL_PRESETS.map((p) => ({
    name: p.name,
    modelId: p.modelId,
    provider: p.provider as ExternalAIModelConfig['provider'],
    endpointUrl: p.endpointUrl || PROVIDER_CATALOG[p.provider].baseUrl,
    requiresKey: p.requiresKey,
    badge: p.badge,
    description: p.description,
    free: true,
  })),
  {
    name: 'Google Gemini 2.5 Flash',
    modelId: 'gemini-2.5-flash',
    provider: 'gemini' as const,
    endpointUrl: '',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'Fast multimodal Gemini model with a free developer tier',
    free: true,
  },
  {
    name: 'DeepSeek-V3 Chat',
    modelId: 'deepseek-chat',
    provider: 'deepseek' as const,
    endpointUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    badge: 'Low Cost',
    description: 'DeepSeek cloud API with exceptional algorithmic code ability',
    free: false,
  },
  {
    name: 'Anthropic Claude 3.5 Haiku',
    modelId: 'claude-3-5-haiku-latest',
    provider: 'anthropic' as const,
    endpointUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    badge: 'Paid',
    description: 'Anthropic fast model for nuanced software architecture',
    free: false,
  },
];

export const AddAIModelModal: React.FC<AddAIModelModalProps> = ({
  isOpen,
  onClose,
  onAddModel,
  onSelectModel,
  onDeleteModel,
  existingModels,
  activeModelId,
}) => {
  // Mode: "without_key" vs "with_key"
  const [authMode, setAuthMode] = useState<'without_key' | 'with_key'>('without_key');
  
  // Form fields
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [provider, setProvider] = useState<ExternalAIModelConfig['provider']>('ollama');
  const [endpointUrl, setEndpointUrl] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Custom Model');

  // Testing status
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'online' | 'offline';
    message: string;
    latencyMs?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof MODEL_PRESETS[0]) => {
    soundFx.playClick();
    setName(preset.name);
    setModelId(preset.modelId);
    setProvider(preset.provider);
    setEndpointUrl(preset.endpointUrl);
    setBadge(preset.badge);
    setDescription(preset.description);
    setAuthMode(preset.requiresKey ? 'with_key' : 'without_key');
    setTestResult(null);
  };

  const handleProviderSelect = (newProvider: ExternalAIModelConfig['provider']) => {
    setProvider(newProvider);
    const meta = getProviderMeta(newProvider);
    setEndpointUrl(meta.baseUrl);
    setAuthMode(meta.requiresKey ? 'with_key' : 'without_key');
    if (!meta.requiresKey) setApiKey('');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    soundFx.playClick();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/studio/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          modelId: modelId.trim() || 'default',
          apiKey: authMode === 'with_key' ? apiKey.trim() : undefined,
          endpointUrl: endpointUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      setTestResult({
        status: data.status === 'online' ? 'online' : 'offline',
        message: data.message || (data.status === 'online' ? 'Connection verified!' : 'Connection failed'),
        latencyMs: data.latencyMs,
      });

      if (data.status === 'online') {
        soundFx.playChime();
      }
    } catch (err: any) {
      setTestResult({
        status: 'offline',
        message: `Connection error: ${err.message || 'Server unreachable'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !modelId.trim()) return;

    soundFx.playChime();
    const newModel: ExternalAIModelConfig = {
      id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      modelId: modelId.trim(),
      provider,
      endpointUrl: endpointUrl.trim() || undefined,
      apiKey: authMode === 'with_key' ? apiKey.trim() : undefined,
      description: description.trim() || (authMode === 'without_key' ? 'Local / Open Model' : 'Cloud Authenticated Model'),
      badge: badge.trim() || (authMode === 'without_key' ? 'No-Key' : 'API-Key'),
      isExternal: true,
      status: testResult?.status || 'untested',
      latencyMs: testResult?.latencyMs,
    };

    onAddModel(newModel, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-amber-500/30 bg-[#0c0c14] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Cpu size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Add AI Model</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  With or Without API Key
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Connect local SLMs (Ollama, LM Studio) without keys, or cloud models with API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick 1-Click Presets */}
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center justify-between">
            <span>Quick 1-Click Presets</span>
            <span className="text-[10px] text-gray-400 font-normal">Click to populate form</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  modelId === preset.modelId
                    ? 'border-amber-400 bg-amber-500/15 text-white'
                    : 'border-white/[0.08] bg-white/[0.02] text-gray-300 hover:border-amber-500/40 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate">{preset.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      preset.free
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {preset.free ? 'FREE' : 'Key Req'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{preset.modelId}</div>
                <div className="text-[9.5px] text-amber-300/80 truncate mt-0.5">{preset.badge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Key Option Selector (Segmented Button) */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#12121c] p-3">
            <label className="block text-xs font-semibold text-gray-200 mb-2">
              Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAuthMode('without_key');
                  setApiKey('');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                  authMode === 'without_key'
                    ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-md'
                    : 'bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white'
                }`}
              >
                <Unlock size={14} className={authMode === 'without_key' ? 'text-emerald-400' : ''} />
                <span>Without API Key (Local / Free)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAuthMode('with_key');
                }}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                  authMode === 'with_key'
                    ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white'
                }`}
              >
                <Lock size={14} className={authMode === 'with_key' ? 'text-amber-400' : ''} />
                <span>With API Key (Cloud Auth)</span>
              </button>
            </div>

            {authMode === 'without_key' ? (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>No API key required! Ideal for local Ollama, LM Studio, vLLM, or open private endpoints.</span>
              </div>
            ) : (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                <ShieldCheck size={13} className="shrink-0" />
                <span>API key will be encrypted and stored locally in your browser session for direct queries.</span>
              </div>
            )}
          </div>

          {/* Model Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Display Label <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ollama DeepSeek R1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.1] bg-[#161622] px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Model Identifier (ID) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. deepseek-r1:8b or llama3.3"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.1] bg-[#161622] px-3 py-2 text-xs text-white font-mono placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center justify-between">
              <span>Provider Platform</span>
              <span className="text-[10px] text-emerald-400">FREE = free tier / free credits</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDER_ORDER.map((id) => {
                const meta = getProviderMeta(id);
                const isFree = meta.freeTier;
                const isSelected = provider === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleProviderSelect(id)}
                    className={`relative rounded-xl px-2.5 py-1.5 text-xs text-center border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-white font-semibold'
                        : isFree
                        ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-200 hover:border-emerald-400/50 hover:text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {meta.label}
                    {isFree && (
                      <span className="ml-1 align-middle text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        FREE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center justify-between">
              <span>Endpoint URL</span>
              <span className="text-[10px] text-gray-400">Leave blank for default cloud API</span>
            </label>
            <div className="relative">
              <Globe size={13} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. http://localhost:11434 or https://api.openai.com/v1"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-[#161622] pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* API Key (if with_key is active) */}
          {authMode === 'with_key' && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center justify-between">
                <span>API Key</span>
                <span className="text-[10px] text-amber-400">Required for cloud provider</span>
              </label>
              <div className="relative">
                <Key size={13} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="password"
                  placeholder="sk-... or AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#161622] pl-8 pr-3 py-2 text-xs text-white font-mono placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Test Connection Result */}
          {testResult && (
            <div
              className={`flex items-center justify-between rounded-xl p-3 text-xs border ${
                testResult.status === 'online'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.status === 'online' ? (
                  <CheckCircle2 size={15} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={15} className="text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.latencyMs && (
                <span className="font-mono text-[10px] opacity-75">{testResult.latencyMs}ms</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-gray-200 hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
              <span>{isTesting ? 'Pinging endpoint...' : 'Test Connection'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !modelId.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-neutral-950 shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <Plus size={14} />
                <span>Save & Activate Model</span>
              </button>
            </div>
          </div>
        </form>

        {/* Existing Custom Models List */}
        {existingModels.length > 0 && (
          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Configured AI Models ({existingModels.length})
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {existingModels.map((m) => {
                const isActive = activeModelId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 border transition-all ${
                      isActive
                        ? 'border-amber-400/60 bg-amber-500/10 text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isActive ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-400'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-white/10 text-gray-300">
                            {m.modelId}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono text-amber-400 bg-amber-500/10">
                            {m.apiKey ? 'API-Key' : 'No-Key'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[280px]">
                          {m.endpointUrl || 'Default Provider Endpoint'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            onSelectModel(m);
                          }}
                          className="rounded-lg bg-white/[0.06] hover:bg-white/[0.12] px-2 py-1 text-[10px] font-medium text-gray-200 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center gap-1">
                          <Check size={11} /> Active
                        </span>
                      )}
                      {onDeleteModel && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            onDeleteModel(m.id);
                          }}
                          title="Delete model"
                          className="rounded-lg p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
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
