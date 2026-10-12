import { describe, it, expect } from 'vitest';
import {
  defaultModelFor,
  normalizeProvider,
  isSafeEndpointUrl,
  isPrivateAddress,
} from '../server.providers';
import {
  getProviderMeta,
  isOpenAICompatible,
  PROVIDER_ORDER,
  FREE_MODEL_PRESETS,
} from '../src/lib/providers';

describe('provider catalog', () => {
  it('exposes every ordered provider in the catalog', () => {
    for (const id of PROVIDER_ORDER) {
      expect(getProviderMeta(id)).toBeTruthy();
      expect(getProviderMeta(id).id).toBe(id);
    }
  });

  it('classifies openai-compatible providers', () => {
    expect(isOpenAICompatible('nvidia')).toBe(true);
    expect(isOpenAICompatible('pollinations')).toBe(true);
    expect(isOpenAICompatible('gemini')).toBe(false);
    expect(isOpenAICompatible('anthropic')).toBe(false);
  });

  it('offers at least one keyless free preset', () => {
    const keyless = FREE_MODEL_PRESETS.filter((p) => p.requiresKey === false);
    expect(keyless.length).toBeGreaterThan(0);
    expect(keyless.some((p) => p.provider === 'pollinations')).toBe(true);
  });
});

describe('defaultModelFor', () => {
  it('returns a known model for each provider', () => {
    for (const id of PROVIDER_ORDER) {
      expect(typeof defaultModelFor(id)).toBe('string');
      expect(defaultModelFor(id).length).toBeGreaterThan(0);
    }
  });

  it('falls back to the custom default for unknown providers', () => {
    expect(defaultModelFor('does-not-exist')).toBe(defaultModelFor('custom'));
  });
});

describe('normalizeProvider', () => {
  it('maps aliases onto canonical ids', () => {
    expect(normalizeProvider('NVIDIA')).toBe('nvidia');
    expect(normalizeProvider('gemini_cloud')).toBe('gemini');
    expect(normalizeProvider(undefined)).toBe('gemini');
  });
});

describe('isSafeEndpointUrl', () => {
  it('accepts http and https endpoints', async () => {
    expect(await isSafeEndpointUrl('https://integrate.api.nvidia.com/v1')).toBe(true);
    expect(await isSafeEndpointUrl('http://localhost:11434/v1')).toBe(true);
  });

  it('rejects non-http schemes', async () => {
    expect(await isSafeEndpointUrl('file:///etc/passwd')).toBe(false);
    expect(await isSafeEndpointUrl('ftp://example.com')).toBe(false);
    expect(await isSafeEndpointUrl('gopher://example.com')).toBe(false);
  });

  it('rejects the cloud metadata service', async () => {
    expect(await isSafeEndpointUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
  });

  it('rejects malformed URLs', async () => {
    expect(await isSafeEndpointUrl('not a url')).toBe(false);
  });

  it('blocks private/internal targets when SSRF protection is enabled', async () => {
    process.env.SUPRU_ALLOW_PRIVATE_ENDPOINTS = '0';
    try {
      expect(await isSafeEndpointUrl('http://127.0.0.1:8080/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://localhost/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://10.0.0.5/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://192.168.1.1/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://172.16.4.4/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://169.254.169.254/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://[::1]/v1')).toBe(false);
      expect(await isSafeEndpointUrl('http://[fd00::1]/v1')).toBe(false);
      // A literal public address stays reachable (no DNS needed in tests).
      expect(await isSafeEndpointUrl('https://8.8.8.8/v1')).toBe(true);
    } finally {
      delete process.env.SUPRU_ALLOW_PRIVATE_ENDPOINTS;
    }
  });
});

describe('isPrivateAddress', () => {
  it('classifies loopback, private, link-local and CGNAT ranges', () => {
    for (const addr of ['127.0.0.1', '::1', '10.1.2.3', '192.168.0.1', '172.31.255.1', '169.254.169.254', '100.64.0.1', 'fc00::1', 'fe80::1', 'localhost']) {
      expect(isPrivateAddress(addr)).toBe(true);
    }
  });

  it('treats public addresses as safe', () => {
    for (const addr of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1', '2606:4700::1']) {
      expect(isPrivateAddress(addr)).toBe(false);
    }
  });
});
