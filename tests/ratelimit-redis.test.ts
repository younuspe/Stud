import net from 'net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Minimal in-process Redis stand-in that speaks enough RESP for
 * rate-limit-redis: SCRIPT LOAD, EVALSHA (increment/get), INFO, PING. It lets
 * us exercise the real ioredis -> RedisStore -> express-rate-limit path without
 * a Redis daemon, so the Redis-backed limiter is covered by CI.
 */
function createFakeRedis() {
  const counters = new Map<string, { count: number; expiresAt: number }>();
  const sha = 'a'.repeat(40);

  const handle = (args: string[]): string => {
    const cmd = (args[0] || '').toUpperCase();
    if (cmd === 'PING') return '+PONG\r\n';
    if (cmd === 'INFO') {
      const info = '# Server\r\nredis_version:7.2.0\r\n';
      return `$${Buffer.byteLength(info)}\r\n${info}\r\n`;
    }
    if (cmd === 'SCRIPT') return `$${sha.length}\r\n${sha}\r\n`;
    if (cmd === 'EVALSHA') {
      const isIncrement = args.length >= 6; // [EVALSHA, sha, n, key, reset, windowMs]
      const key = args[3];
      const now = Date.now();
      const entry = counters.get(key);
      if (!entry || entry.expiresAt <= now) {
        const windowMs = isIncrement ? Number(args[5]) : 0;
        counters.set(key, { count: isIncrement ? 1 : 0, expiresAt: now + windowMs });
      } else if (isIncrement) {
        entry.count += 1;
      }
      const current = counters.get(key)!;
      const ttl = Math.max(0, current.expiresAt - now);
      return `*2\r\n:${current.count}\r\n:${ttl}\r\n`;
    }
    return '+OK\r\n';
  };

  // Parses one RESP array (or inline command); returns null while incomplete.
  const parse = (buf: Buffer): { args: string[]; rest: Buffer } | null => {
    if (buf.length === 0) return null;
    if (buf[0] !== 0x2a /* '*' */) {
      const nl = buf.indexOf('\r\n');
      if (nl === -1) return null;
      const line = buf.subarray(0, nl).toString();
      return { args: line.split(/\s+/), rest: buf.subarray(nl + 2) };
    }
    const headerEnd = buf.indexOf('\r\n');
    if (headerEnd === -1) return null;
    const count = parseInt(buf.subarray(1, headerEnd).toString(), 10);
    let offset = headerEnd + 2;
    const args: string[] = [];
    for (let i = 0; i < count; i++) {
      if (buf[offset] !== 0x24 /* '$' */) return null;
      const lenEnd = buf.indexOf('\r\n', offset);
      if (lenEnd === -1) return null;
      const len = parseInt(buf.subarray(offset + 1, lenEnd).toString(), 10);
      const start = lenEnd + 2;
      if (buf.length < start + len + 2) return null;
      args.push(buf.subarray(start, start + len).toString());
      offset = start + len + 2;
    }
    return { args, rest: buf.subarray(offset) };
  };

  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    let buffer = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      let parsed: { args: string[]; rest: Buffer } | null;
      while ((parsed = parse(buffer))) {
        buffer = parsed.rest;
        try {
          socket.write(handle(parsed.args));
        } catch {
          socket.write('-ERR fake redis error\r\n');
        }
      }
    });
    socket.on('error', () => {});
  });

  return {
    listen: () =>
      new Promise<number>((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve((server.address() as net.AddressInfo).port));
      }),
    close: () =>
      new Promise<void>((resolve) => {
        // ioredis keeps a socket open; destroy them so close() can resolve.
        for (const socket of sockets) socket.destroy();
        server.close(() => resolve());
      }),
  };
}

describe('Redis-backed rate-limit store', () => {
  let fake: ReturnType<typeof createFakeRedis>;
  const openClients: Array<() => void | Promise<void>> = [];

  beforeAll(async () => {
    fake = createFakeRedis();
    const port = await fake.listen();
    process.env.REDIS_URL = `redis://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    // Quit the Redis client first so no in-flight command rejects when the
    // fake server's sockets are destroyed, then drop the server.
    for (const close of openClients) {
      try {
        await close();
      } catch {
        /* ignore */
      }
    }
    delete process.env.REDIS_URL;
    await fake.close();
  });

  it('increments a shared counter through the real RedisStore', async () => {
    const { createRateLimitStore } = await import('../server.ratelimit');
    const { store, close } = createRateLimitStore();
    expect(store).toBeDefined();
    if (close) openClients.push(close);

    (store as any).init?.({ windowMs: 60_000 });
    const first = await (store as any).increment('client-a');
    const second = await (store as any).increment('client-a');
    const other = await (store as any).increment('client-b');

    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);
    expect(other.totalHits).toBe(1); // separate key, separate counter
    expect(second.resetTime).toBeInstanceOf(Date);
  });

  it('returns no store when REDIS_URL is unset (in-memory default)', async () => {
    delete process.env.REDIS_URL;
    const { createRateLimitStore } = await import('../server.ratelimit');
    expect(createRateLimitStore().store).toBeUndefined();
  });
});
