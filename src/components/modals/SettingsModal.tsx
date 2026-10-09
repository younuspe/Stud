import React from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  Cpu, 
  Flame, 
  Check,
  RotateCcw
} from 'lucide-react';
import { PersonaType, UserSettings } from '../../types/chat';
import { soundFx } from '../../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  const personas: { id: PersonaType; title: string; desc: string; icon: string }[] = [
    {
      id: 'supru_cat',
      title: 'Supru Cat AI',
      desc: 'Witty, brilliant, feline persona with sharp coding prowess and "Meow to wow!"',
      icon: '🐾',
    },
    {
      id: 'standard_ai',
      title: 'Standard AI',
      desc: 'Crisp, concise, direct generative intelligence without persona fluff',
      icon: '⚡',
    },
    {
      id: 'code_architect',
      title: 'Code Architect',
      desc: 'Principal engineer focusing on robust architectures, type safety, and clean code',
      icon: '💻',
    },
    {
      id: 'creative_writer',
      title: 'Creative Writer',
      desc: 'Imaginative prose, captivating worldbuilding, and cinematic story flow',
      icon: '🎨',
    },
    {
      id: 'sovereign_omni',
      title: 'Sovereign Omni-System',
      desc: 'Tiered Consciousness (Oracle/Expert/Ghost), Law of Absolute Invariance & Genesis Manifesting',
      icon: '🌌',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2b2b3a] bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supru Settings</h3>
              <p className="text-xs text-gray-400">Personalize AI personality and parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="space-y-5 py-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Persona selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Active Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {personas.map((p) => {
                const isSelected = settings.persona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      soundFx.playClick();
                      onUpdateSettings({ persona: p.id });
                    }}
                    className={`flex flex-col justify-between rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'border-[#22222e] bg-[#161622] hover:border-gray-500 hover:bg-[#1a1a27]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{p.icon}</span>
                      {isSelected && <Check size={14} className="text-amber-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{p.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {p.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2 rounded-2xl border border-[#22222e] bg-[#161622] p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400" />
                <span>Creativity & Wit (Temperature)</span>
              </span>
              <span className="font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Precise & Logical (0.1)</span>
              <span>Balanced (0.7)</span>
              <span>Wild & Expressive (1.0)</span>
            </div>
          </div>

          {/* Sound & Audio Toggles */}
          <div className="space-y-2 rounded-2xl border border-[#22222e] bg-[#161622] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Volume2 size={14} className="text-amber-400" />
                  <span>Interactive Audio Chimes & Purrs</span>
                </div>
                <div className="text-[11px] text-gray-400">
                  Plays synth UI audio on send and interaction
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onUpdateSettings({ soundEffects: !settings.soundEffects });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEffects ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEffects ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#22222d] pt-4">
          <button
            onClick={() => {
              soundFx.playClick();
              onResetSettings();
            }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-neutral-950 transition-all hover:from-amber-400 hover:to-amber-500 shadow-md"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
