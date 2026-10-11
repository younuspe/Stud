import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/utils/logger';

describe('logger', () => {
  const original = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, original);
  });

  it('routes each level to the matching console method', () => {
    logger.info('hello');
    logger.warn('careful');
    logger.error('boom');

    expect(console.info).toHaveBeenCalledWith('hello');
    expect(console.warn).toHaveBeenCalledWith('careful');
    expect(console.error).toHaveBeenCalledWith('boom');
  });

  it('preserves multiple arguments and error objects', () => {
    const err = new Error('disk full');
    logger.error('write failed:', err);

    expect(console.error).toHaveBeenCalledWith('write failed:', err);
  });

  it('never throws when console is unavailable', () => {
    expect(() => logger.error('still fine')).not.toThrow();
  });
});
