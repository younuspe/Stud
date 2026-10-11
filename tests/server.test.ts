import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

process.env.SUPRU_DISABLE_RATE_LIMIT = '1';

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
});
