import React, { useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { 
  X, 
  Check, 
  Sparkles, 
  Server, 
  Key, 
  Globe, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ExternalAIModelConfig, StudioModelSettings } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface ConnectExternalModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ExternalAIModelConfig;
  onSelectModel: (model: ExternalAIModelConfig) => void;
  modelsList: ExternalAIModelConfig[];
  onUpdateModel: (updated: ExternalAIModelConfig) => void;
  settings: StudioModelSettings;
  onUpdateSettings: (settings: StudioModelSettings) => void;
}

export const ConnectExternalModelModal: React.FC<ConnectExternalModelModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  onSelectModel,
  modelsList,
  onUpdateModel,
  settings,
  onUpdateSettings,
}) => {
  const [selectedModelId, setSelectedModelId] = useState(activeModel.id);
  const [apiKey, setApiKey] = useState(activeModel.apiKey || '');
  const [endpointUrl, setEndpointUrl] = useState(activeModel.endpointUrl || '');
  const [systemInstruction, setSystemInstruction] = useState(settings.systemInstruction);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [maxOutputTokens, setMaxOutputTokens] = useState(settings.maxOutputTokens);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'online' | 'offline'; message: string; latencyMs?: number } | null>(null);

  if (!isOpen) return null;

  const currentSelected = modelsList.find(m => m.id === selectedModelId) || activeModel;

  const handleModelChange = (id: string) => {
    soundFx.playClick();
    setSelectedModelId(id);
    const target = modelsList.find(m => m.id === id);
    if (target) {
      setApiKey(target.apiKey || '');
      setEndpointUrl(target.endpointUrl || '');
    }
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    soundFx.playClick();
    setIsTesting(true);
    setTestResult(null);

    try {
      let data: { status: string; message?: string; latencyMs?: number };
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const started = performance.now();
        data = await (await import('@tauri-apps/api/core')).invoke<{ status: string; message: string; models: string[] }>(
          'test_provider_connection',
          {
            provider: currentSelected.provider,
            endpointUrl: endpointUrl.trim(),
            modelName: currentSelected.modelId,
            apiKey: apiKey.trim() || null,
          }
        );
        data.latencyMs = Math.round(performance.now() - started);
      } else {
        const res = await fetch('/api/studio/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: currentSelected.provider,
            modelId: currentSelected.modelId,
            apiKey: apiKey.trim() || undefined,
            endpointUrl: endpointUrl.trim() || undefined,
          }),
        });
        data = await res.json();
      }
      setTestResult({
        status: data.status === 'online' ? 'online' : 'offline',
        message: data.message || (data.status === 'online' ? 'Connection verified!' : 'Connection failed'),
        latencyMs: data.latencyMs,
      });

      if (data.status === 'online') {
        soundFx.playChime();
        onUpdateModel({
          ...currentSelected,
          apiKey: apiKey.trim(),
          endpointUrl: endpointUrl.trim(),
          status: 'online',
          latencyMs: data.latencyMs,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'offline',
        message: err.message || 'Network error while reaching server',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndApply = () => {
    soundFx.playClick();
    const updated: ExternalAIModelConfig = {
      ...currentSelected,
      apiKey: apiKey.trim(),
      endpointUrl: endpointUrl.trim(),
      status: testResult?.status || currentSelected.status,
      latencyMs: testResult?.latencyMs || currentSelected.latencyMs,
    };

    onUpdateModel(updated);
    onSelectModel(updated);
    onUpdateSettings({
      ...settings,
      systemInstruction,
      temperature,
      maxOutputTokens,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-[#0e0e15] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f2e] bg-[#12121b] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Connect External AI Models</h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-300 border border-amber-500/30">
                  Google AI Studio Standard
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Switch or connect Google Gemini, OpenAI, Claude, DeepSeek, Groq, Ollama, or custom endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
          {/* 1. Model Selector Grid */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2">
              Select Active AI Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {modelsList.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModelChange(m.id)}
                    className={`flex items-start justify-between rounded-xl border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/10 text-white shadow-sm'
                        : 'border-[#222232] bg-[#14141f] text-gray-300 hover:border-gray-600 hover:bg-[#181824]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>{m.name}</span>
                        {m.badge && (
                          <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/30">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{m.description}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          m.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                        }`}
                        title={m.status === 'online' ? 'Verified Online' : 'Untested / Ready'}
                      />
                      {isSelected && <Check size={14} className="text-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. API Key / Endpoint Configuration */}
          <div className="rounded-xl border border-[#222232] bg-[#12121c] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Authentication & Endpoint ({currentSelected.name})</span>
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Stored locally in browser</span>
              </span>
            </div>

            <div>
              <label className="block text-[10.5px] font-medium text-gray-400 mb-1">
                {currentSelected.provider === 'gemini' 
                  ? 'Gemini API Key (Optional — default cloud key active)' 
                  : `${currentSelected.provider.toUpperCase()} API Key`}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentSelected.provider === 'gemini' ? 'Default cloud credentials active or enter AI Studio key...' : 'sk-...'}
                className="w-full rounded-lg border border-[#2b2b3d] bg-[#0c0c14] px-3 py-1.5 font-mono text-xs text-white placeholder-gray-600 outline-none focus:border-amber-400"
              />
            </div>

            {(currentSelected.provider === 'ollama' || currentSelected.provider === 'lmstudio' || currentSelected.provider === 'custom' || currentSelected.provider === 'openai' || currentSelected.provider === 'deepseek' || currentSelected.provider === 'groq') && (
              <div>
                <label className="block text-[10.5px] font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Globe size={11} />
                  <span>Custom Endpoint URL (Optional)</span>
                </label>
                <input
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder={currentSelected.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'}
                  className="w-full rounded-lg border border-[#2b2b3d] bg-[#0c0c14] px-3 py-1.5 font-mono text-xs text-white placeholder-gray-600 outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Test Connection Button & Indicator */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <Server size={12} />}
                <span>{isTesting ? 'Pinging Model...' : 'Test Connection'}</span>
              </button>

              {testResult && (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${
                  testResult.status === 'online' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {testResult.status === 'online' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Google AI Studio Parameters */}
          <div className="rounded-xl border border-[#222232] bg-[#12121c] p-3.5 space-y-3">
            <span className="text-[11px] font-bold text-gray-200 flex items-center gap-1.5">
              <Sliders size={13} className="text-amber-400" />
              <span>Model Tuning Parameters</span>
            </span>

            <div>
              <label className="block text-[10.5px] font-medium text-gray-400 mb-1">
                System Instructions
              </label>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                rows={2}
                placeholder="Give the model behavioral instructions..."
                className="w-full resize-none rounded-lg border border-[#2b2b3d] bg-[#0c0c14] p-2 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[10.5px] font-medium text-gray-400 mb-1">
                  <span>Temperature</span>
                  <span className="text-amber-400 font-mono">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10.5px] font-medium text-gray-400 mb-1">
                  <span>Max Tokens</span>
                  <span className="text-amber-400 font-mono">{maxOutputTokens}</span>
                </div>
                <select
                  value={maxOutputTokens}
                  onChange={(e) => setMaxOutputTokens(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-[#2b2b3d] bg-[#0c0c14] px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value={1024}>1,024 Tokens</option>
                  <option value={2048}>2,048 Tokens</option>
                  <option value={4096}>4,096 Tokens</option>
                  <option value={8192}>8,192 Tokens (Max)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-[#1f1f2e] bg-[#12121b] px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                currentSelected.status === 'online' || testResult?.status === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span>Active: <strong className="text-white font-mono">{currentSelected.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-md transition-colors"
            >
              <Check size={14} />
              <span>Apply & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
