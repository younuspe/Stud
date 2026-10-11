type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const envLevel = (): LogLevel | null => {
  const raw =
    (globalThis as any)?.process?.env?.LOG_LEVEL ??
    (import.meta as any)?.env?.VITE_LOG_LEVEL;
  if (typeof raw !== 'string') return null;
  const value = raw.toLowerCase();
  return value in ORDER ? (value as LogLevel) : null;
};

const minLevel = (): LogLevel => {
  const explicit = envLevel();
  if (explicit) return explicit;
  // Browser production builds stay quiet below warnings; dev keeps debug.
  const mode = (import.meta as any)?.env?.MODE;
  return mode === 'production' ? 'warn' : 'debug';
};

const shouldLog = (level: LogLevel) => ORDER[level] >= ORDER[minLevel()];

/**
 * Minimal leveled logger shared by the Express server and the React app.
 * Silence it with LOG_LEVEL (server) or VITE_LOG_LEVEL (browser); otherwise
 * warnings and errors only in production builds.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog('debug')) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (shouldLog('info')) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (shouldLog('error')) console.error(...args);
  },
};

export default logger;
