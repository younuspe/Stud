import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Cpu, 
  Wifi, 
  Check, 
  RefreshCw, 
  Zap, 
  Laptop, 
  Cloud, 
  HardDrive,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { LocalHostConfig, AIProviderType } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface LocalProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LocalHostConfig;
  onUpdateConfig: (newConfig: Partial<LocalHostConfig>) => void;
}

export const LocalProviderModal: React.FC<LocalProviderModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [detectedModels, setDetectedModels] = useState<string[]>([]);

  if (!isOpen) return null;

  const providers: {
    id: AIProviderType;
    name: string;
    badge: string;
    desc: string;
    defaultUrl: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'gemini_cloud',
      name: 'Google Gemini Cloud',
      badge: 'Cloud Powered',
      desc: 'Gemini 3.8 Flash, Gemini 3.1 Flash Image, and Veo 3.1 Fast Video',
      defaultUrl: 'https://generativelanguage.googleapis.com',
      icon: <Cloud size={18} className="text-amber-400" />,
    },
    {
      id: 'ollama_local',
      name: 'Ollama (Localhost)',
      badge: '100% Offline / Local',
      desc: 'Run Llama 3, DeepSeek-Coder, Mistral, or Qwen on your local machine',
      defaultUrl: 'http://localhost:11434',
      icon: <HardDrive size={18} className="text-emerald-400" />,
    },
    {
      id: 'lmstudio_local',
      name: 'LM Studio / LocalAI',
      badge: 'OpenAI-Compatible Local',
      desc: 'Connect to LM Studio, vLLM, or text-generation-webui local server',
      defaultUrl: 'http://localhost:1234/v1',
      icon: <Laptop size={18} className="text-sky-400" />,
    },
    {
      id: 'offline_core',
      name: 'Supru Smart Core (Zero-Key)',
      badge: 'Built-in Engine',
      desc: 'Instant, zero-configuration feline neural intelligence running without keys',
      defaultUrl: 'local://builtin',
      icon: <Zap size={18} className="text-amber-300" />,
    },
  ];

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging local model host endpoint...');
    soundFx.playClick();

    try {
      const res = await fetch('/api/provider/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          endpointUrl: config.endpointUrl,
          modelName: config.modelName,
        }),
      });

      const data = await res.json();
      if (data.status === 'online') {
        setTestStatus('success');
        setTestMessage(data.message || 'Connected successfully to local host!');
        setDetectedModels(data.models || []);
        soundFx.playPurr();
      } else {
        setTestStatus('failed');
        setTestMessage(data.message || 'Unable to connect to local host.');
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`Connection error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-amber-500/30 bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Server size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Engine & Localhost Manager</h3>
              <p className="text-xs text-gray-400">Run seamlessly with Cloud models or Localhost instances</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 py-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Provider Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Select Inference Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {providers.map((p) => {
                const isSelected = config.provider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      soundFx.playClick();
                      onUpdateConfig({
                        provider: p.id,
                        endpointUrl: p.defaultUrl,
                      });
                      setTestStatus('idle');
                    }}
                    className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                        : 'border-[#22222f] bg-[#161622] hover:border-gray-500 hover:bg-[#1a1a27]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {p.icon}
                        <span className="text-xs font-bold text-white">{p.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-amber-400/90">{p.badge}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {p.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {config.provider === 'gemini_cloud' && (
            <div className="space-y-2 rounded-2xl border border-[#272738] bg-[#151522] p-4">
              <label className="text-xs font-semibold text-gray-200">Gemini API Key</label>
              <input
                type="password"
                autoComplete="new-password"
                value={config.apiKey || ''}
                onChange={(e) => onUpdateConfig({ apiKey: e.target.value })}
                placeholder="Paste your Gemini API key"
                className="w-full rounded-xl border border-[#2b2b3c] bg-[#101018] px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-amber-500/60"
              />
              <p className="text-[10px] leading-relaxed text-gray-500">
                Required for cloud chat. Use local Ollama or LM Studio if you want to work without a cloud key.
              </p>
            </div>
          )}

          {/* Localhost Configuration Details (if local provider selected) */}
          {config.provider !== 'gemini_cloud' && config.provider !== 'offline_core' && (
            <div className="space-y-3 rounded-2xl border border-[#272738] bg-[#151522] p-4">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Localhost Endpoint Setup</span>
                <span className="text-[10px] text-emerald-400 font-mono">No API key required</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-300">Endpoint URL</label>
                <input
                  type="text"
                  value={config.endpointUrl}
                  onChange={(e) => onUpdateConfig({ endpointUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full rounded-xl border border-[#2b2b3c] bg-[#101018] px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-300">Model Name / Tag</label>
                <input
                  type="text"
                  value={config.modelName}
                  onChange={(e) => onUpdateConfig({ modelName: e.target.value })}
                  placeholder="llama3 or mistral or deepseek-coder"
                  className="w-full rounded-xl border border-[#2b2b3c] bg-[#101018] px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Test Button & Status */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#202030] px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-[#28283c] hover:text-white transition-colors"
                >
                  <RefreshCw size={13} className={testStatus === 'testing' ? 'animate-spin' : ''} />
                  <span>Test Localhost Connection</span>
                </button>

                {testMessage && (
                  <div
                    className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                      testStatus === 'success'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    {testMessage}
                    {detectedModels.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {detectedModels.slice(0, 5).map((m, idx) => (
                          <span
                            key={idx}
                            onClick={() => onUpdateConfig({ modelName: m })}
                            className="cursor-pointer rounded bg-[#1e1e2c] px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#22222d] pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Active: <span className="font-semibold text-white">{config.provider.replace('_', ' ').toUpperCase()}</span></span>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-md"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
