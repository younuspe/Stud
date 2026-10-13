export type TauriInvokeResult<T = unknown> = T | null;

declare global {
  interface Window {
    __TAURI__?: {
      invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
    __TAURI_INTERNAL__?: {
      invoke?: (command: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export async function safeInvoke<T = unknown>(command: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const invoker =
    typeof window !== 'undefined'
      ? (window as any).__TAURI__?.invoke ?? (window as any).__TAURI_INTERNAL__?.invoke
      : undefined;

  if (typeof invoker === 'function') {
    try {
      const result = await invoker(command, args);
      return (result ?? null) as T | null;
    } catch (error) {
      console.warn(`[safeInvoke] ${command} failed`, error);
    }
  }

  return null;
}

export function isDesktopRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).__TAURI__ || (window as any).__TAURI_INTERNAL__);
}

export async function safeClipboardWrite(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function safeCanvasContext(canvas: HTMLCanvasElement | null) {
  if (!canvas) return null;
  try {
    return canvas.getContext('2d');
  } catch {
    return null;
  }
}
