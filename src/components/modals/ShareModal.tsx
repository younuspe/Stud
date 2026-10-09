import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Sparkles,
  Link2
} from 'lucide-react';
import { ChatThread } from '../../types/chat';
import { soundFx } from '../../utils/audio';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThread: ChatThread | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  activeThread,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    soundFx.playClick();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMarkdown = () => {
    if (!activeThread) return;
    const md = activeThread.messages
      .map((m) => `### ${m.role === 'user' ? 'User' : 'Supru Ecosystem'}\n\n${m.content}\n`)
      .join('\n---\n\n');

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    soundFx.playClick();
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleExportJson = () => {
    if (!activeThread) return;
    const jsonStr = JSON.stringify(activeThread, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supru-chat-${activeThread.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundFx.playMeowChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#2b2b3a] bg-[#121218] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22222d] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Conversation</h3>
              <p className="text-xs text-gray-400">Export or share this Supru dialogue</p>
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
        <div className="space-y-4 py-5">
          {/* Share Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Share Public Link
            </label>
            <div className="flex items-center rounded-2xl border border-[#252535] bg-[#161622] p-1.5 pl-3">
              <Link2 size={15} className="mr-2 text-gray-500 shrink-0" />
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-transparent text-xs text-gray-300 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Export Transcripts
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleCopyMarkdown}
                disabled={!activeThread || activeThread.messages.length === 0}
                className="flex flex-col items-start gap-1 rounded-2xl border border-[#252535] bg-[#161622] p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-[#1c1c2b] disabled:opacity-40"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <FileText size={14} className="text-amber-400" />
                  <span>Copy Markdown</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {copiedMarkdown ? 'Copied to clipboard!' : 'Formatted prose & code'}
                </span>
              </button>

              <button
                onClick={handleExportJson}
                disabled={!activeThread || activeThread.messages.length === 0}
                className="flex flex-col items-start gap-1 rounded-2xl border border-[#252535] bg-[#161622] p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-[#1c1c2b] disabled:opacity-40"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Download size={14} className="text-sky-400" />
                  <span>Export JSON</span>
                </div>
                <span className="text-[11px] text-gray-400">Complete raw conversation data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#22222d] pt-4 flex justify-end">
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
