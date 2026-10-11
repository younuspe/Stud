import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss delay in ms; 0 keeps the toast until dismissed. */
  duration?: number;
}

interface ToastContextValue {
  toast: (input: Omit<Toast, 'id'> & { id?: string }) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<ToastVariant, { icon: React.FC<{ size?: number }>; ring: string; text: string }> = {
  success: { icon: CheckCircle2, ring: 'border-emerald-500/30', text: 'text-emerald-400' },
  error: { icon: XCircle, ring: 'border-rose-500/30', text: 'text-rose-400' },
  warning: { icon: AlertTriangle, ring: 'border-amber-500/30', text: 'text-amber-400' },
  info: { icon: Info, ring: 'border-sky-500/30', text: 'text-sky-400' },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    ({ id, duration = 4200, ...rest }) => {
      const toastId = id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id: toastId, duration, ...rest }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(toastId), duration);
        timers.current.set(toastId, timer);
      }
      return toastId;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ variant: 'success', title, description }),
      error: (title, description) => toast({ variant: 'error', title, description }),
      warning: (title, description) => toast({ variant: 'warning', title, description }),
      info: (title, description) => toast({ variant: 'info', title, description }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2.5"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((t) => {
              const meta = VARIANT_META[t.variant];
              const Icon = meta.icon;
              return (
                <div
                  key={t.id}
                  role="status"
                  aria-live={t.variant === 'error' ? 'assertive' : 'polite'}
                  className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${meta.ring} bg-[#12121a]/95 p-3.5 shadow-2xl backdrop-blur-xl animate-slideUp`}
                >
                  <span className={`mt-0.5 shrink-0 ${meta.text}`}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{t.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className="shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
