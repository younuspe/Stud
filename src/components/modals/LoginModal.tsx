import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserSettings } from '../../types/chat';
import { soundFx } from '../../utils/audio';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateUserSettings: (newSettings: Partial<UserSettings>) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateUserSettings,
}) => {
  const [name, setName] = useState(userSettings.userName || '');
  const [email, setEmail] = useState(userSettings.userEmail || '');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    soundFx.playMeowChime();
    onUpdateUserSettings({
      userName: name.trim(),
      userEmail: email.trim(),
      isLoggedIn: true,
    });
    onClose();
  };

  const handleLogout = () => {
    soundFx.playClick();
    onUpdateUserSettings({
      isLoggedIn: false,
      userName: '',
      userEmail: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#2b2b3a] bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {userSettings.isLoggedIn ? 'Local Profile' : 'Set Up Local Profile'}
              </h3>
              <p className="text-xs text-gray-400">Stored on this device only; cloud account sync is not implemented</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="py-5">
          {userSettings.isLoggedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-[#161622] p-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-neutral-950 font-bold flex items-center justify-center text-lg">
                  {userSettings.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{userSettings.userName}</div>
                  <div className="text-xs text-amber-300/80">{userSettings.userEmail}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={11} />
                    <span>Local profile saved — no cloud authentication</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Display Name</label>
                <div className="flex items-center rounded-2xl border border-[#262636] bg-[#161622] px-3.5 py-2.5 text-xs focus-within:border-amber-500/60">
                  <User size={15} className="mr-2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-transparent text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Email Address</label>
                <div className="flex items-center rounded-2xl border border-[#262636] bg-[#161622] px-3.5 py-2.5 text-xs focus-within:border-amber-500/60">
                  <Mail size={15} className="mr-2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-transparent text-white outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-semibold text-neutral-950 shadow-lg hover:from-amber-400 hover:to-amber-500 active:scale-98 transition-all"
              >
                <span>Save Local Profile</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
