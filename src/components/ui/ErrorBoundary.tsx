import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: string | null;
}

/**
 * Catches render-time crashes so a single faulty module cannot blank the whole
 * app. Renders a branded recovery screen with reload / reset actions.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info: info.componentStack ?? null });
    console.error('[Supru] Uncaught render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('supru_studio_windows_v2');
    } catch {
      // ignore storage failures
    }
    window.location.reload();
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050508] p-6 text-[#f3f4f8]">
        <div className="surface-card w-full max-w-lg rounded-3xl p-8 text-center animate-scaleIn">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <AlertTriangle size={26} />
          </div>
          <h1 className="text-lg font-bold text-white">Something glitched in the ecosystem</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-400">
            A module hit an unexpected error. Your conversations are saved locally — reloading is safe.
          </p>
          {error.message && (
            <pre className="mt-4 max-h-28 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-left text-[11px] leading-relaxed text-rose-300/90 scrollbar-none">
              {error.message}
            </pre>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              <RotateCcw size={15} /> Reload app
            </button>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
            >
              <Home size={15} /> Reset window layout
            </button>
          </div>
          {info && (
            <details className="mt-5 text-left">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300">
                Technical details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[10px] leading-relaxed text-gray-500 scrollbar-none">
                {info}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
