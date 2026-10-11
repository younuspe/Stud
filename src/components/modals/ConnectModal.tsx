import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Server, 
  Sparkles,
  Zap,
  RefreshCw
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onTestConnection: () => Promise<{ status: string; message?: string; latencyMs?: number }>;
  serverInfo: {
    status: string;
    hasApiKey: boolean;
    model: string;
    version: string;
  };
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onTestConnection,
  serverInfo,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [connectionMessage, setConnectionMessage] = useState('Test the selected model to verify a live connection.');

  if (!isOpen) return null;

  const handleTestPing = async () => {
    if (isPinging) return;
    setIsPinging(true);
    setPingLatency(null);
    setConnectionMessage('Sending a live request to the selected model…');
    soundFx.playClick();
    const started = performance.now();
    try {
      const result = await onTestConnection();
      setPingLatency(result.latencyMs ?? Math.round(performance.now() - started));
      setConnectionMessage(result.message || (result.status === 'online' ? 'Live model request succeeded.' : 'The selected model did not respond successfully.'));
      if (result.status === 'online') soundFx.playMeowChime();
    } catch (error) {
      setPingLatency(Math.round(performance.now() - started));
      setConnectionMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/30 bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supru Neural Link</h3>
              <p className="text-xs text-gray-400">Generative AI Engine & Health</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 py-5">
          {/* Status Card */}
          <div className="flex items-center justify-between rounded-2xl border border-[#252535] bg-[#161622] p-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  {isConnected ? 'Model request verified' : 'Model not verified'}
                </div>
                <div className="text-xs text-gray-400">
                  {serverInfo.model || 'No model selected'}
                </div>
              </div>
            </div>

            <button
              onClick={() => void handleTestPing()}
              disabled={isPinging}
              className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/25 disabled:cursor-wait disabled:opacity-60"
            >
              {isPinging ? 'Testing…' : 'Test Model'}
            </button>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-[#20202d] bg-[#15151f] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Cpu size={14} className="text-amber-400" />
                <span>Base Model</span>
              </div>
              <div className="font-semibold text-white">{serverInfo.model}</div>
            </div>

            <div className="rounded-2xl border border-[#20202d] bg-[#15151f] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Activity size={14} className="text-emerald-400" />
                <span>Roundtrip Ping</span>
              </div>
              <div className="font-semibold text-white">
                {pingLatency === null ? 'Not tested' : `${pingLatency} ms`}
              </div>
            </div>

            <div className="rounded-2xl border border-[#20202d] bg-[#15151f] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Server size={14} className="text-sky-400" />
                <span>Server Runtime</span>
              </div>
              <div className="font-semibold text-white">Tauri Desktop + Rust</div>
            </div>

            <div className="rounded-2xl border border-[#20202d] bg-[#15151f] p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Sparkles size={14} className="text-purple-400" />
                <span>API Status</span>
              </div>
              <div className="font-semibold text-emerald-400">
                {serverInfo.hasApiKey ? 'API key configured' : 'No cloud key (local may not need one)'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#22222d] pt-4">
          <div className="max-w-[65%] text-[11px] leading-relaxed text-gray-400" role="status" aria-live="polite">
            {connectionMessage}
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-neutral-950 transition-all hover:from-amber-400 hover:to-amber-500 shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
