/**
 * Server-side unified provider layer.
 *
 * Turns a { provider, modelId, apiKey, endpointUrl } request into a real
 * chat completion against a hosted (or local) model. Every provider is
 * normalised onto one of three wire protocols:
 *   - Gemini native  (@google/genai)
 *   - OpenAI compatible  (POST {base}/chat/completions)
 *   - Anthropic native   (POST {base}/messages)
 */

import { GoogleGenAI } from '@google/genai';
import dns from 'node:dns';
import net from 'node:net';
import { getProviderMeta, isOpenAICompatible } from './src/lib/providers';
import { logger } from './src/utils/logger';

export interface ProviderRequest {
  provider?: string;
  modelId?: string;
  apiKey?: string;
  endpointUrl?: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ProviderCallResult {
  ok: boolean;
  reply?: string;
  error?: string;
  provider: string;
  model: string;
  simulated?: boolean;
}

const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.0-flash',
  nvidia: 'nvidia/llama-3.1-nemotron-70b-instruct',
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'meta-llama/llama-3.3-70b-instruct:free',
  cerebras: 'llama-3.3-70b',
  mistral: 'mistral-small-latest',
  github: 'openai/gpt-4o-mini',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  pollinations: 'openai',
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
  anthropic: 'claude-3-5-haiku-latest',
  ollama: 'llama3.3',
  lmstudio: 'local-model',
  custom: 'local-model',
};

export function defaultModelFor(provider: string): string {
  return DEFAULT_MODELS[provider] || DEFAULT_MODELS.custom;
}

/** Map legacy local aliases onto canonical catalog ids. */
const PROVIDER_ALIASES: Record<string, string> = {
  gemini_cloud: 'gemini',
  ollama_local: 'ollama',
  lmstudio_local: 'lmstudio',
  custom_local: 'custom',
};

export function normalizeProvider(provider: string | undefined): string {
  const p = (provider || 'gemini').trim().toLowerCase();
  return PROVIDER_ALIASES[p] || p;
}

/** True when the process may reach private/loopback/link-local hosts. Defaults
 *  to local (so local model servers work); a public deployment should set
 *  SUPRU_ALLOW_PRIVATE_ENDPOINTS=0 to close the SSRF surface. */
function privateEndpointsAllowed(): boolean {
  return process.env.SUPRU_ALLOW_PRIVATE_ENDPOINTS !== '0';
}

/** True for loopback, private, link-local, CGNAT, unique-local, and other
 *  addresses that must not be reachable when SSRF protection is on. */
export function isPrivateAddress(host: string): boolean {
  let h = host.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  // IPv4-mapped IPv6 (::ffff:127.0.0.1).
  h = h.replace(/^::ffff:/, '');
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (h === '::1' || h === '::' || h === '0.0.0.0') return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h)) return true; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]:/i.test(h)) return true; // fe80::/10 link-local
  return false;
}

/**
 * Reject endpoint URLs that are not plain HTTP(S), that target the cloud
 * metadata service, or — when private endpoints are disallowed — that point at
 * any loopback/private/link-local host. A literal IP is checked directly; a
 * hostname is resolved and every answer is checked, so a public name that
 * resolves to an internal address (DNS-rebinding style) is rejected too.
 */
export async function isSafeEndpointUrl(raw: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname;
  if (host === '169.254.169.254') return false;
  if (privateEndpointsAllowed()) return true;
  if (isPrivateAddress(host)) return false;
  if (net.isIP(host)) return true;
  try {
    const records = await dns.promises.lookup(host, { all: true });
    return records.length > 0 && records.every((r) => !isPrivateAddress(r.address));
  } catch {
    return false;
  }
}

/** Resolve the base URL for an OpenAI-compatible provider. */
async function resolveBaseUrl(req: ProviderRequest): Promise<string> {
  const meta = getProviderMeta(normalizeProvider(req.provider) || 'custom');
  const candidate = req.endpointUrl?.trim() || meta.baseUrl;
  const base = (await isSafeEndpointUrl(candidate)) ? candidate : meta.baseUrl;
  return base.replace(/\/$/, '');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST with retry/backoff. Free and keyless tiers throttle aggressively with
 * 402/429 (and occasional 5xx); retrying a couple of times turns transient
 * throttling into successful calls instead of user-visible failures.
 */
async function postWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (![402, 408, 425, 429, 500, 502, 503, 504].includes(res.status)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
      if (attempt === attempts - 1) return res;
    } catch (err) {
      lastErr = err;
      if (init.signal?.aborted) throw err;
      if (attempt === attempts - 1) throw err;
    }
    // Exponential backoff with jitter — keyless tiers throttle per-IP and
    // need a moment to drain before accepting the next request.
    await sleep(700 * Math.pow(2, attempt) + Math.random() * 300);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Call a provider and return the assistant text. Never throws: failures are
 * reported through the returned result so callers can fall back cleanly.
 */
export async function callProvider(
  req: ProviderRequest,
  messages: ChatMessage[],
  options: { systemInstruction?: string; temperature?: number; maxTokens?: number; signal?: AbortSignal } = {}
): Promise<ProviderCallResult> {
  const provider = normalizeProvider(req.provider);
  const model = req.modelId?.trim() || defaultModelFor(provider);
  const temperature = typeof options.temperature === 'number' ? options.temperature : 0.7;
  const systemInstruction = options.systemInstruction || '';

  try {
    if (provider === 'gemini') {
      if (!req.apiKey) return { ok: false, error: 'Missing Gemini API key', provider, model };
      const client = new GoogleGenAI({ apiKey: req.apiKey });
      const contents = messages
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          temperature,
          ...(options.maxTokens ? { maxOutputTokens: options.maxTokens } : {}),
        },
      });
      return { ok: true, reply: response.text || '', provider, model };
    }

    if (provider === 'anthropic') {
      if (!req.apiKey) return { ok: false, error: 'Missing Anthropic API key', provider, model };
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: options.signal,
        body: JSON.stringify({
          model,
          max_tokens: options.maxTokens || 2048,
          temperature,
          ...(systemInstruction ? { system: systemInstruction } : {}),
          messages: messages
            .filter((m) => m.content && m.content.trim())
            .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `Anthropic ${res.status}: ${body.slice(0, 200)}`, provider, model };
      }
      const data: any = await res.json();
      const reply = (data.content || []).map((c: any) => c.text || '').join('');
      return { ok: true, reply, provider, model };
    }

    if (isOpenAICompatible(provider)) {
      // Local providers (ollama / lmstudio / custom) need no key.
      const meta = getProviderMeta(provider);
      const base = await resolveBaseUrl(req);
      const isOllamaNative = provider === 'ollama' || provider === 'ollama_local';

      // Ollama exposes a native /api/chat endpoint; prefer it when talking to a
      // bare Ollama host, but fall back to the OpenAI-compatible surface.
      const url = isOllamaNative && !/\/v1$/.test(base)
        ? `${base}/api/chat`
        : `${base}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (req.apiKey) headers['Authorization'] = `Bearer ${req.apiKey}`;
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://supru.ai';
        headers['X-Title'] = 'Supru AI';
      }

      const bodyPayload: any = isOllamaNative && !/\/v1$/.test(base)
        ? {
            model,
            stream: false,
            options: { temperature },
            messages: messages
              .filter((m) => m.content && m.content.trim())
              .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          }
        : {
            model,
            temperature,
            ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              ...messages
                .filter((m) => m.content && m.content.trim())
                .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            ],
          };

      const res = await postWithRetry(url, {
        method: 'POST',
        headers,
        signal: options.signal,
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const text = await res.text();
        // Some keyless/hosted gateways reject strict parameter combos
        // (e.g. tiny max_tokens). Retry once with a minimal payload.
        if (!isOllamaNative && options.maxTokens) {
          const retry = await postWithRetry(url, {
            method: 'POST',
            headers,
            signal: options.signal,
            body: JSON.stringify({
              model,
              messages: bodyPayload.messages,
            }),
          });
          if (retry.ok) {
            const rdata: any = await retry.json();
            const rreply = rdata.choices?.[0]?.message?.content;
            if (rreply) return { ok: true, reply: rreply, provider, model };
          }
        }
        const hint =
          res.status === 402 || res.status === 429
            ? ' — the free tier is rate-limited, retry shortly or add an API key in Run settings.'
            : '';
        return {
          ok: false,
          error: `${meta.label} ${res.status}: ${text.slice(0, 200)}${hint}`,
          provider,
          model,
        };
      }

      const data: any = await res.json();
      const reply = isOllamaNative && !/\/v1$/.test(base)
        ? data.message?.content
        : data.choices?.[0]?.message?.content;
      if (!reply) return { ok: false, error: `${meta.label} returned an empty response`, provider, model };
      return { ok: true, reply, provider, model };
    }

    return { ok: false, error: `Unsupported provider "${provider}"`, provider, model };
  } catch (err: any) {
    const msg = err?.name === 'TimeoutError' ? 'Request timed out' : err?.message || String(err);
    return { ok: false, error: msg, provider, model };
  }
}

/** Lightweight reachability / credential check used by the "Test" buttons. */
export async function testProvider(req: ProviderRequest): Promise<{
  status: 'online' | 'offline';
  message: string;
  latencyMs: number;
  models?: string[];
}> {
  const provider = normalizeProvider(req.provider);
  const meta = getProviderMeta(provider);
  const model = req.modelId?.trim() || defaultModelFor(provider);
  const started = Date.now();

  // Local servers: probe their model-listing endpoints.
  if (provider === 'ollama' || provider === 'ollama_local') {
    const base = (await resolveBaseUrl(req)).replace(/\/v1$/, '');
    try {
      const r = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3500) });
      if (r.ok) {
        const d: any = await r.json();
        const models = (d.models || []).map((m: any) => m.name);
        return {
          status: 'online',
          latencyMs: Date.now() - started,
          models,
          message: `Ollama reachable at ${base} (${models.length} models).`,
        };
      }
    } catch {
      /* fall through */
    }
    return {
      status: 'offline',
      latencyMs: Date.now() - started,
      message: `Could not reach Ollama at ${base}. Is it running?`,
    };
  }

  if (provider === 'lmstudio' || provider === 'custom' || provider === 'lmstudio_local' || provider === 'custom_local') {
    const base = await resolveBaseUrl(req);
    try {
      const r = await fetch(`${base}/models`, { signal: AbortSignal.timeout(3500) });
      if (r.ok) {
        const d: any = await r.json();
        const models = (d.data || []).map((m: any) => m.id);
        return {
          status: 'online',
          latencyMs: Date.now() - started,
          models,
          message: `Endpoint reachable at ${base} (${models.length} models).`,
        };
      }
    } catch {
      /* fall through */
    }
    return {
      status: 'offline',
      latencyMs: Date.now() - started,
      message: `Could not reach ${base}. Ensure the server is running.`,
    };
  }

  if (meta.requiresKey && !req.apiKey) {
    return {
      status: 'offline',
      latencyMs: Date.now() - started,
      message: `${meta.label} requires an API key. Add one to connect.`,
    };
  }

  // Cloud providers: perform a minimal real completion.
  const probe = await callProvider(
    req,
    [{ role: 'user', content: 'Reply with the single word: ok' }],
    { maxTokens: 8, temperature: 0 }
  );
  return {
    status: probe.ok ? 'online' : 'offline',
    latencyMs: Date.now() - started,
    message: probe.ok
      ? `Connected to ${meta.label} (${probe.model}) in ${Date.now() - started}ms.`
      : `${meta.label} connection failed — ${probe.error}`,
  };
}
