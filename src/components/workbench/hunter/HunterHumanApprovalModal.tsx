import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileCode,
  Terminal,
  Cpu,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { HunterApprovalRequest } from '../../../types/workbench';
import { soundFx } from '../../../utils/audio';

interface HunterHumanApprovalModalProps {
  request: HunterApprovalRequest;
  proposalContent?: string;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onClose: () => void;
}

export const HunterHumanApprovalModal: React.FC<HunterHumanApprovalModalProps> = ({
  request,
  proposalContent,
  onApprove,
  onReject,
  onClose
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleConfirmApprove = () => {
    soundFx.playChime();
    onApprove(request.id);
  };

  const handleConfirmReject = () => {
    soundFx.playClick();
    onReject(request.id, rejectReason || 'Rejected by human operator via permission gate');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#ff6b6b]/40 bg-[#161618] p-5 shadow-2xl text-xs font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/40">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Human Approval Gate Required</span>
                <span className="rounded bg-[#ff6b6b]/20 px-2 py-0.2 text-[9px] font-mono text-[#ff6b6b] border border-[#ff6b6b]/30 uppercase font-bold">
                  {request.risk} Risk
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Rust execution layer paused action pending human consent (Policy: deny &gt; ask &gt; allow)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-white">
            <Lock size={14} />
          </button>
        </div>

        {/* Body Information */}
        <div className="mt-3.5 space-y-2.5">
          <div className="rounded-xl bg-[#0e0e11] p-3 border border-[#2a2a2c]">
            <div className="text-[10px] uppercase font-bold text-[#c49a6c] font-mono">
              What will happen:
            </div>
            <div className="mt-1 text-xs font-semibold text-white">
              {request.whatWillHappen}
            </div>
          </div>

          <div className="rounded-xl bg-[#0e0e11] p-3 border border-[#2a2a2c]">
            <div className="text-[10px] uppercase font-bold text-gray-400 font-mono">
              Why:
            </div>
            <div className="mt-1 text-xs text-gray-300">
              {request.why}
            </div>
          </div>

          {request.command && (
            <div className="rounded-xl bg-[#050505] p-2.5 border border-white/[0.06]">
              <div className="text-[10px] uppercase font-bold text-[#4af626] font-mono flex items-center gap-1">
                <Terminal size={11} />
                <span>Command to Execute:</span>
              </div>
              <pre className="mt-1 font-mono text-xs text-[#4af626]">
                {request.command}
              </pre>
            </div>
          )}

          {/* Affected Files */}
          <div className="rounded-xl bg-[#0e0e11] p-2.5 border border-[#2a2a2c]">
            <div className="text-[10px] uppercase font-bold text-gray-400 font-mono mb-1 flex items-center gap-1">
              <FileCode size={11} />
              <span>Affected Files & Resources:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {request.affectedFiles.map((file) => (
                <span
                  key={file}
                  className="rounded bg-[#1a1a20] px-2 py-0.5 text-[10.5px] font-mono text-sky-300 border border-white/[0.08]"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>

          {proposalContent && (
            <div className="rounded-xl bg-[#050505] p-2.5 border border-amber-500/20">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">Proposed complete file contents</div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-gray-200">{proposalContent}</pre>
            </div>
          )}

          {/* Requesting Agent */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>Requesting Agent: <strong className="text-white uppercase font-mono">{request.agentId}</strong></span>
            <span>Policy Boundary: <strong className="text-[#c49a6c] font-mono">Rust Authoritative</strong></span>
          </div>

          {showRejectInput && (
            <div className="mt-2 space-y-1">
              <label className="text-[10px] text-gray-400 font-mono">Reason for Rejection:</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this action was rejected..."
                className="w-full rounded-lg border border-[#ff6b6b]/40 bg-[#0e0e11] px-2.5 py-1.5 text-xs text-white outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
          {!showRejectInput ? (
            <button
              onClick={() => setShowRejectInput(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
            >
              <XCircle size={13} />
              <span>Reject Action</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmReject}
              className="flex items-center gap-1.5 rounded-lg bg-[#ff6b6b] px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
            >
              <XCircle size={13} />
              <span>Confirm Rejection</span>
            </button>
          )}

          <button
            onClick={handleConfirmApprove}
            className="flex items-center gap-1.5 rounded-lg bg-[#c49a6c] px-4 py-1.5 text-xs font-bold text-neutral-950 hover:bg-[#b0885c] active:scale-95 transition-all shadow-md ml-auto"
          >
            <CheckCircle2 size={13} />
            <span>Approve Action (Pass Gate)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
