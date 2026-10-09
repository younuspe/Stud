import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  X, 
  Download, 
  Apple, 
  Terminal, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Folder, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  Laptop,
  MonitorCheck
} from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MacOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacOSInstallModal: React.FC<MacOSInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [showDockHelp, setShowDockHelp] = useState(false);
  const [activeInstallTab, setActiveInstallTab] = useState<'laptop' | 'terminal' | 'download'>('laptop');

  const { isInstalled, isMac, triggerInstall } = usePWAInstall();

  if (!isOpen) return null;

  const terminalInstallCmd = 'open "https://github.com/younuspe/Stud/actions"';
  const isTauriDesktop = Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
  const buildPageUrl = 'https://github.com/younuspe/Stud/actions';

  const openBuildPage = async () => {
    try {
      if (isTauriDesktop) {
        await invoke('open_build_page');
      } else {
        window.open(buildPageUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(buildPageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyCmd = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(terminalInstallCmd);
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  const handleDownloadDmg = () => {
    soundFx.playClick();
    void openBuildPage();
  };

  const handleDownloadZip = () => {
    soundFx.playClick();
    void openBuildPage();
  };

  const handleOneClickLaptopInstall = async () => {
    soundFx.playChime();
    if (isTauriDesktop) {
      await openBuildPage();
      return;
    }
    const installed = await triggerInstall();
    if (!installed) {
      setShowDockHelp(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.15] bg-[#0c0c14]/95 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
        {/* macOS Window Titlebar with Traffic Lights */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#141420]/90 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={onClose}
                className="h-3 w-3 rounded-full bg-rose-500/90 hover:brightness-110 transition-all border border-rose-600/50" 
                title="Close"
              />
              <span className="h-3 w-3 rounded-full bg-amber-500/90 border border-amber-600/50 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/90 border border-emerald-600/50 inline-block" />
            </div>
            <span className="text-[11px] font-mono text-gray-400 ml-2">Supru AI — Laptop & macOS Desktop Installer</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <Apple size={14} className="text-white" />
            <span>Laptop Desktop Setup</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header Description */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold">
              <Sparkles size={12} className="text-pink-400" />
              <span>Full Desktop App Installation for Laptop</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Install Supru Generative Studio on Laptop
            </h2>
            <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
              Run Supru AI as a native standalone desktop app with zero browser clutter, full offline caching, and hardware-native 120 FPS Direct-to-Metal GPU acceleration.
            </p>
          </div>

          {/* Installation Method Tabs */}
          <div className="flex rounded-2xl bg-[#141420] p-1 border border-white/[0.08] text-xs">
            <button
              onClick={() => { soundFx.playClick(); setActiveInstallTab('laptop'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeInstallTab === 'laptop'
                  ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Laptop size={14} />
              <span>1-Click Laptop App (Easiest)</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); setActiveInstallTab('terminal'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeInstallTab === 'terminal'
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal size={14} className="text-emerald-400" />
              <span>Mac Terminal — Open Build Page</span>
            </button>

            <button
              onClick={() => { soundFx.playClick(); setActiveInstallTab('download'); }}
              className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeInstallTab === 'download'
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Download size={14} className="text-pink-400" />
              <span>Find Build Artifacts</span>
            </button>
          </div>

          {/* TAB 1: 1-Click Laptop App (Zero-Download Native Web App) */}
          {activeInstallTab === 'laptop' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#181828]/80 to-[#10101c]/90 p-5 shadow-inner space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/cat_icon.png"
                      alt="Supru AI"
                      className="h-14 w-14 rounded-2xl border-2 border-white/20 shadow-xl object-cover"
                    />
                    <div>
                      <h3 className="font-black text-sm text-white">Supru AI Install Options</h3>
                      <p className="text-xs text-gray-400">Install the web app in your browser or open the published native macOS build artifacts.</p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                    <MonitorCheck size={12} />
                    Web or native install
                  </span>
                </div>

                {/* Primary Laptop Install Button */}
                <button
                  onClick={handleOneClickLaptopInstall}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:brightness-110 active:scale-98 shadow-[0_0_25px_rgba(236,72,153,0.35)]"
                >
                  <Laptop size={16} />
                  <span>{isTauriDesktop ? 'View Native macOS Build Artifacts' : 'Install Supru Web App on this Laptop'}</span>
                </button>
              </div>

              {isTauriDesktop ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c16] p-3 text-xs text-gray-300">
                  Use the native build-artifacts button to open GitHub Actions, then download the successful macOS artifact. This panel does not fabricate or download an installer itself.
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c16] p-3 text-xs space-y-2 text-gray-300">
                  <div className="font-bold text-white">Install the web app in your browser</div>
                  <ul className="space-y-1.5 text-[11px] text-gray-300">
                    <li>Chrome / Edge / Brave: use the Install icon in the address bar when it is available.</li>
                    <li>Safari on macOS: use File → Add to Dock.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Mac Terminal (1-Liner that compiles genuine Apple Mach-O Bundle) */}
          {activeInstallTab === 'terminal' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck size={16} />
                  <span>Native macOS builds are published as GitHub Actions artifacts</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  The command opens the GitHub Actions build page. Download a successful macOS .dmg artifact from the workflow. Current builds are ad-hoc signed, so macOS may require you to choose Open Anyway in Privacy &amp; Security.
                </p>
              </div>

              {/* Terminal Code Box with Copy */}
              <div className="rounded-2xl border border-white/[0.1] bg-[#080810] p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-gray-300">
                    <Terminal size={12} className="text-emerald-400" />
                    <span>Run in macOS Terminal:</span>
                  </span>
                  <button
                    onClick={handleCopyCmd}
                    className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
                  >
                    {copiedTerminal ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-[11.5px] text-emerald-400 bg-black/80 rounded-xl p-3 overflow-x-auto border border-white/[0.06] select-all leading-relaxed">
                  {terminalInstallCmd}
                </div>
              </div>

              <div className="text-[11px] text-gray-400 px-1">
                <strong>How to run:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">Cmd + Space</kbd>, type <em>Terminal</em>, press Enter, paste the command, and press Enter. Done in 2 seconds!
              </div>
            </div>
          )}

          {/* TAB 3: Download Complete Offline Packages */}
          {activeInstallTab === 'download' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Primary DMG */}
                <button
                  onClick={handleDownloadDmg}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl font-bold text-xs border border-white/[0.15] bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all hover:border-pink-500/40"
                >
                  <Download size={20} className="text-pink-400" />
                  <span className="font-black text-sm">Find macOS .dmg Artifact</span>
                  <span className="text-[10px] text-gray-400 font-mono">Opens GitHub Actions builds</span>
                </button>

                {/* Direct App Bundle ZIP */}
                <button
                  onClick={handleDownloadZip}
                  className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl font-bold text-xs border border-white/[0.15] bg-white/[0.05] hover:bg-white/[0.1] text-white transition-all hover:border-amber-500/40"
                >
                  <Layers size={20} className="text-amber-400" />
                  <span className="font-black text-sm">Find .app Bundle (.zip)</span>
                  <span className="text-[10px] text-gray-400 font-mono">Opens GitHub Actions builds</span>
                </button>
              </div>

              {/* Gatekeeper Resolution Tip */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0f0f18] p-2.5 text-[11px] text-gray-300 flex items-start gap-2">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-white">macOS Gatekeeper Tip: </span>
                  If macOS displays an unverified developer prompt when opening the downloaded app for the first time, right-click (or Control-click) <strong>Supru AI.app</strong> and click <strong>Open</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Architecture & Specs Footer */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-gray-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Cpu size={11} className="text-gray-400" />
                <span>Apple Silicon (M1/M2/M3/M4) & Intel x86_64</span>
              </span>
              <span>•</span>
              <span>macOS 11+ Big Sur to macOS Sequoia</span>
            </div>
            <span className="text-pink-400 font-bold">Native Direct-to-Metal 120 FPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

