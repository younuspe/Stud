import React from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  Command, 
  Terminal, 
  Zap, 
  Cat, 
  Lightbulb 
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#2b2b3a] bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supru Ecosystem Guide</h3>
              <p className="text-xs text-gray-400">Tips, hotkeys & prompt engineering</p>
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
        <div className="space-y-4 py-5 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Welcome note */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 leading-relaxed text-amber-200">
            <span className="font-bold">Welcome to Supru Ecosystem!</span> Crafted to prove that AI can be both immensely capable and delightfully charismatic. “Not only a cat... but a generative mastermind.”
          </div>

          {/* Hotkeys */}
          <div className="space-y-2">
            <div className="font-semibold uppercase tracking-wider text-gray-400">
              Keyboard Shortcuts
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-xl bg-[#161622] p-2.5 px-3">
                <span className="text-gray-300">Send prompt</span>
                <kbd className="rounded bg-[#222230] px-2 py-0.5 font-mono text-[11px] text-amber-300 border border-[#2e2e40]">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#161622] p-2.5 px-3">
                <span className="text-gray-300">New line in input</span>
                <kbd className="rounded bg-[#222230] px-2 py-0.5 font-mono text-[11px] text-amber-300 border border-[#2e2e40]">
                  Shift + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#161622] p-2.5 px-3">
                <span className="text-gray-300">Focus search bar</span>
                <kbd className="rounded bg-[#222230] px-2 py-0.5 font-mono text-[11px] text-amber-300 border border-[#2e2e40]">
                  ⌘ / Ctrl + K
                </kbd>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="space-y-2">
            <div className="font-semibold uppercase tracking-wider text-gray-400">
              Feline Power Tips
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-[#22222f] bg-[#161622] p-3 text-gray-300">
                <Cat size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Switch AI Personas Anytime</div>
                  <div className="text-[11px] text-gray-400">
                    Use the mode selector in the top bar to toggle between Supru Cat, Code Architect, Standard AI, and Creative Writer.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[#22222f] bg-[#161622] p-3 text-gray-300">
                <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Multimodal Vision</div>
                  <div className="text-[11px] text-gray-400">
                    Click the (+) button to attach images, diagrams, or UI mockups for instant feline analysis.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#22222d] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-semibold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-md"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
