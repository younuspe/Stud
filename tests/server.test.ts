import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

process.env.SUPRU_DISABLE_RATE_LIMIT = '1';
// Keep the body limit small so the oversized-payload test stays cheap.
process.env.SUPRU_MAX_BODY_MB = '1';

let app: any;
beforeAll(async () => {
  ({ app } = await import('../server'));
});

describe('GET /api/status', () => {
  it('reports the running app version', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version');
  });
});

describe('GET /api/providers', () => {
  it('returns the provider catalog and free presets', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.providers)).toBe(true);
    expect(res.body.providers.length).toBeGreaterThan(0);
    expect(res.body.presets.length).toBeGreaterThan(0);
  });
});

describe('API error handling', () => {
  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Unknown API route/);
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/terminal/execute')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Malformed JSON/);
  });
});

describe('GitHub route input validation', () => {
  it('rejects owner names containing path traversal', async () => {
    const res = await request(app)
      .post('/api/github/repo')
      .send({ owner: 'a/../b', repo: 'c' });
    expect(res.status).toBe(400);
  });

  it('rejects branch names with query injection', async () => {
    const res = await request(app)
      .post('/api/github/contents')
      .send({ owner: 'x', repo: 'y', branch: 'main&per_page=1' });
    expect(res.status).toBe(400);
  });

  it('rejects missing owner/repo', async () => {
    const res = await request(app).post('/api/github/repo').send({});
    expect(res.status).toBe(400);
  });

  it('accepts a request without an explicit branch (resolved server-side)', async () => {
    // No branch must not 400: the handler resolves the repo default branch.
    const res = await request(app)
      .post('/api/github/contents')
      .send({ owner: 'x', repo: 'y', path: 'README.md' });
    expect(res.status).not.toBe(400);
  });
});

describe('terminal execute validation', () => {
  it('requires a command string', async () => {
    const res = await request(app).post('/api/terminal/execute').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Command string is required/);
  });
});

describe('security headers', () => {
  it('sets helmet defaults', async () => {
    const res = await request(app).get('/api/status');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('sends a restrictive Content-Security-Policy', async () => {
    const res = await request(app).get('/api/status');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});

describe('request tracing', () => {
  it('assigns an X-Request-Id and echoes an inbound one', async () => {
    const generated = await request(app).get('/api/status');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const inbound = await request(app).get('/api/status').set('x-request-id', 'trace-abc-123');
    expect(inbound.headers['x-request-id']).toBe('trace-abc-123');
  });
});

describe('response compression', () => {
  it('gzip-compresses a large JSON response', async () => {
    const res = await request(app).get('/api/providers').set('Accept-Encoding', 'gzip');
    expect(res.headers['content-encoding']).toBe('gzip');
  });
});

describe('request body limits', () => {
  it('rejects an oversized JSON body with 413', async () => {
    const big = 'x'.repeat(1024 * 1024 + 1024); // just over the 1mb test limit
    const res = await request(app)
      .post('/api/terminal/execute')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ command: big }));
    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/too large/i);
  });
});

describe('GET /api/health', () => {
  it('reports ok with uptime and version', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptimeSeconds).toBe('number');
    expect(res.body.version).toBeTruthy();
  });
});

describe('server-side GitHub token', () => {
  it('exposes hasGithubToken in /api/status as a boolean', async () => {
    const res = await request(app).get('/api/status');
    expect(typeof res.body.hasGithubToken).toBe('boolean');
  });
});

describe('exec guard (C1 regression)', () => {
  it('allows a direct loopback caller', async () => {
    const res = await request(app)
      .post('/api/terminal/execute')
      .send({ command: 'echo ok' });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('ok');
  });

  it('rejects a forwarded (proxied) request even from a loopback socket', async () => {
    const res = await request(app)
      .post('/api/terminal/execute')
      .set('X-Forwarded-For', '203.0.113.7')
      .send({ command: 'id' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/restricted to the local/i);
  });

  it('rejects a forwarded request to /api/agent/step', async () => {
    const res = await request(app)
      .post('/api/agent/step')
      .set('X-Real-IP', '203.0.113.7')
      .send({ command: 'whoami' });
    expect(res.status).toBe(403);
  });

  it('leaves non-exec routes reachable through the proxy', async () => {
    const res = await request(app).get('/api/providers').set('X-Forwarded-For', '203.0.113.7');
    expect(res.status).toBe(200);
  });
});
