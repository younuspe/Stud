import { createRequire } from 'node:module';
import type { Store } from 'express-rate-limit';
import { logger } from './src/utils/logger';

const nodeRequire = createRequire(import.meta.url);

export interface RateLimitStore {
  store?: Store;
  /** Closes the backing Redis connection, if one was opened. */
  close?: () => void | Promise<void>;
}

/**
 * Optional Redis-backed rate-limit store. Enabled only when REDIS_URL is set
 * AND the optional `ioredis` + `rate-limit-redis` packages are installed, so
 * the default install stays dependency-light and single-node. With Redis the
 * limits are shared across instances and survive restarts; without it the
 * caller keeps express-rate-limit's in-memory store.
 */
export function createRateLimitStore(): RateLimitStore {
  const url = process.env.REDIS_URL;
  if (!url) return {};

  try {
    // require (not import) so a missing optional dep throws synchronously and
    // falls back instead of failing module load.
    const Redis = nodeRequire('ioredis');
    const { RedisStore } = nodeRequire('rate-limit-redis');
    const client = new Redis(url);
    client.on?.('error', (err: unknown) => logger.warn('Redis rate-limit client error:', err));
    const store = new RedisStore({
      sendCommand: (...args: string[]) => client.call(...args),
    }) as unknown as Store;
    logger.info('Rate limiting is backed by Redis (shared, persistent).');
    return { store, close: () => client.quit().catch(() => client.disconnect()) };
  } catch {
    logger.warn(
      'REDIS_URL is set but ioredis/rate-limit-redis are not installed; ' +
        'falling back to in-memory rate limiting.',
    );
    return {};
  }
}
