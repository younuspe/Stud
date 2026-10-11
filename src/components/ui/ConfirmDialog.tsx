import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ModalShell } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small confirmation dialog used before destructive, hard-to-undo actions. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      ariaLabel={title}
      backdropClassName="!z-[90]"
      panelClassName="w-full max-w-sm"
    >
      <div className="surface-card rounded-2xl p-6">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              destructive
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
          >
            <AlertTriangle size={19} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-200 transition-colors hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              destructive
                ? 'bg-rose-500 text-white hover:bg-rose-400'
                : 'bg-amber-500 text-black hover:bg-amber-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
