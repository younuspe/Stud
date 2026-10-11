import { describe, it, expect } from 'vitest';
import {
  defaultModelFor,
  normalizeProvider,
  isSafeEndpointUrl,
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
  it('accepts http and https endpoints', () => {
    expect(isSafeEndpointUrl('https://integrate.api.nvidia.com/v1')).toBe(true);
    expect(isSafeEndpointUrl('http://localhost:11434/v1')).toBe(true);
  });

  it('rejects non-http schemes', () => {
    expect(isSafeEndpointUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeEndpointUrl('ftp://example.com')).toBe(false);
    expect(isSafeEndpointUrl('gopher://example.com')).toBe(false);
  });

  it('rejects the cloud metadata service', () => {
    expect(isSafeEndpointUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeEndpointUrl('not a url')).toBe(false);
  });
});
