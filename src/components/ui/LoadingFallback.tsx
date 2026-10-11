import React from 'react';

/**
 * Branded, accessible suspense fallback used while a lazily-loaded module
 * (workbench view or modal) is being fetched.
 */
export const LoadingFallback: React.FC<{ label?: string }> = ({ label = 'Loading Supru workspace…' }) => (
  <div
    className="flex h-full w-full items-center justify-center bg-[#050508]"
    role="status"
    aria-live="polite"
    aria-label={label}
  >
    <div className="flex flex-col items-center gap-4 animate-fadeIn">
      <div className="relative h-12 w-12">
        <span className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-400" />
        <span className="absolute inset-2 rounded-full bg-amber-500/10" />
      </div>
      <p className="shimmer-text text-xs font-medium tracking-wide">{label}</p>
    </div>
  </div>
);
