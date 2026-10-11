/**
 * Canonical catalog of AI providers and free-of-charge hosted models.
 *
 * This module is imported by both the Express server (server.ts) and the
 * browser bundle, so it must stay free of Node/DOM specific APIs.
 */

export type ProviderId =
  | 'gemini'
  | 'nvidia'
  | 'groq'
  | 'openrouter'
  | 'cerebras'
  | 'mistral'
  | 'github'
  | 'together'
  | 'pollinations'
  | 'openai'
  | 'deepseek'
  | 'anthropic'
  | 'ollama'
  | 'lmstudio'
  | 'custom';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** OpenAI-compatible base URL. Empty string means "handled natively" (Gemini). */
  baseUrl: string;
  requiresKey: boolean;
  freeTier: boolean;
  badge: string;
  description: string;
  keyPlaceholder?: string;
  docsUrl?: string;
}

export const PROVIDER_CATALOG: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: '',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Tier',
    description: 'Google Gemini multimodal models via the Gemini Developer API.',
    keyPlaceholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  nvidia: {
    id: 'nvidia',
    label: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Credits',
    description: 'NVIDIA NIM microservices. OpenAI-compatible. Free inference credits at build.nvidia.com.',
    keyPlaceholder: 'nvapi-...',
    docsUrl: 'https://build.nvidia.com',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Tier',
    description: 'Ultra-fast inference on Groq LPUs with a generous free tier.',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Models',
    description: 'OpenRouter gateway exposing many :free models from multiple vendors.',
    keyPlaceholder: 'sk-or-...',
    docsUrl: 'https://openrouter.ai/keys',
  },
  cerebras: {
    id: 'cerebras',
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Tier',
    description: 'Cerebras Inference cloud with a free developer tier.',
    keyPlaceholder: 'csk-...',
    docsUrl: 'https://cloud.cerebras.ai',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Tier',
    description: 'Mistral hosted models with a free experimentation tier.',
    keyPlaceholder: '...',
    docsUrl: 'https://console.mistral.ai/api-keys',
  },
  github: {
    id: 'github',
    label: 'GitHub Models',
    baseUrl: 'https://models.github.ai/inference',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Tier',
    description: 'GitHub Models inference endpoint using a GitHub personal access token.',
    keyPlaceholder: 'github_pat_...',
    docsUrl: 'https://github.com/marketplace/models',
  },
  together: {
    id: 'together',
    label: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    freeTier: true,
    badge: 'Free Models',
    description: 'Together AI with several free and open-weight models.',
    keyPlaceholder: '...',
    docsUrl: 'https://api.together.xyz',
  },
  pollinations: {
    id: 'pollinations',
    label: 'Pollinations (No Key)',
    baseUrl: 'https://text.pollinations.ai/openai',
    requiresKey: false,
    freeTier: true,
    badge: 'No Key · Free',
    description: 'Free, keyless OpenAI-compatible text generation and image synthesis. Works with zero setup.',
    docsUrl: 'https://pollinations.ai',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    freeTier: false,
    badge: 'Paid',
    description: 'OpenAI GPT models. OpenAI-compatible.',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    freeTier: false,
    badge: 'Low Cost',
    description: 'DeepSeek cloud API. OpenAI-compatible.',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    requiresKey: true,
    freeTier: false,
    badge: 'Paid',
    description: 'Anthropic Claude models via the native Messages API.',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    requiresKey: false,
    freeTier: true,
    badge: 'No Key',
    description: 'Run open models locally with Ollama. No API key required.',
    docsUrl: 'https://ollama.com',
  },
  lmstudio: {
    id: 'lmstudio',
    label: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    freeTier: true,
    badge: 'No Key',
    description: 'Connect to any model served by LM Studio. No API key required.',
    docsUrl: 'https://lmstudio.ai',
  },
  custom: {
    id: 'custom',
    label: 'Custom Endpoint',
    baseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    freeTier: true,
    badge: 'Custom',
    description: 'Any OpenAI-compatible endpoint (vLLM, llama.cpp, private gateway).',
  },
};

/** Order used when rendering provider pickers. */
export const PROVIDER_ORDER: ProviderId[] = [
  'pollinations',
  'nvidia',
  'gemini',
  'groq',
  'openrouter',
  'cerebras',
  'mistral',
  'github',
  'together',
  'openai',
  'deepseek',
  'anthropic',
  'ollama',
  'lmstudio',
  'custom',
];

export interface FreeModelPreset {
  /** Display label. */
  name: string;
  provider: ProviderId;
  modelId: string;
  endpointUrl?: string;
  requiresKey: boolean;
  badge: string;
  description: string;
  /** Highlight as a recommended free model. */
  free?: boolean;
}

/**
 * Curated free / low-cost hosted models. Model IDs follow each provider's
 * published catalog; verify on the provider console if one is renamed.
 */
export const FREE_MODEL_PRESETS: FreeModelPreset[] = [
  {
    name: 'Pollinations (No Key · GPT-OSS)',
    provider: 'pollinations',
    modelId: 'openai',
    endpointUrl: 'https://text.pollinations.ai/openai',
    requiresKey: false,
    badge: 'No Key · Free',
    description: 'Zero-setup free model. Works instantly without any API key or account.',
    free: true,
  },
  {
    name: 'Pollinations (No Key · Mistral)',
    provider: 'pollinations',
    modelId: 'mistral',
    endpointUrl: 'https://text.pollinations.ai/openai',
    requiresKey: false,
    badge: 'No Key · Free',
    description: 'Keyless free Mistral-class model via Pollinations.',
    free: true,
  },
  {
    name: 'NVIDIA Nemotron 3 Super 120B',
    provider: 'nvidia',
    modelId: 'nvidia/nemotron-3-super-120b-a12b',
    requiresKey: true,
    badge: 'NVIDIA NIM',
    description: 'NVIDIA flagship Nemotron 3 Super 120B reasoning model on NIM (free credits).',
    free: true,
  },
  {
    name: 'NVIDIA GPT-OSS 20B',
    provider: 'nvidia',
    modelId: 'openai/gpt-oss-20b',
    requiresKey: true,
    badge: 'NVIDIA NIM',
    description: 'OpenAI GPT-OSS 20B served through NVIDIA NIM.',
    free: true,
  },
  {
    name: 'NVIDIA Llama Nemotron 70B',
    provider: 'nvidia',
    modelId: 'nvidia/llama-3.1-nemotron-70b-instruct',
    requiresKey: true,
    badge: 'NVIDIA NIM',
    description: 'NVIDIA-tuned Llama 3.1 Nemotron 70B on NIM.',
    free: true,
  },
  {
    name: 'NVIDIA Nemotron 3 Nano Omni',
    provider: 'nvidia',
    modelId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    requiresKey: true,
    badge: 'NVIDIA NIM',
    description: 'Compact, fast NVIDIA Nemotron 3 Nano Omni reasoning model.',
    free: true,
  },
  {
    name: 'Groq Llama 3.3 70B',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'Extreme-speed Llama 3.3 70B on Groq LPUs.',
    free: true,
  },
  {
    name: 'Groq Llama 3.1 8B',
    provider: 'groq',
    modelId: 'llama-3.1-8b-instant',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'Very fast, low-latency 8B model on Groq.',
    free: true,
  },
  {
    name: 'OpenRouter DeepSeek R1 (free)',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1:free',
    requiresKey: true,
    badge: 'Free Model',
    description: 'DeepSeek R1 through OpenRouter free tier.',
    free: true,
  },
  {
    name: 'OpenRouter Llama 3.3 70B (free)',
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    requiresKey: true,
    badge: 'Free Model',
    description: 'Meta Llama 3.3 70B through OpenRouter free tier.',
    free: true,
  },
  {
    name: 'Cerebras Llama 3.3 70B',
    provider: 'cerebras',
    modelId: 'llama-3.3-70b',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'Cerebras Inference with a free developer tier.',
    free: true,
  },
  {
    name: 'Mistral Small',
    provider: 'mistral',
    modelId: 'mistral-small-latest',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'Mistral small hosted model on the free tier.',
    free: true,
  },
  {
    name: 'GitHub GPT-4o mini',
    provider: 'github',
    modelId: 'openai/gpt-4o-mini',
    requiresKey: true,
    badge: 'Free Tier',
    description: 'OpenAI GPT-4o mini through GitHub Models (PAT required).',
    free: true,
  },
  {
    name: 'Ollama Llama 3.3 (Local)',
    provider: 'ollama',
    modelId: 'llama3.3',
    endpointUrl: 'http://localhost:11434',
    requiresKey: false,
    badge: 'No Key',
    description: 'Local Llama 3.3 via Ollama. Fully offline, no key.',
    free: true,
  },
  {
    name: 'LM Studio (Local)',
    provider: 'lmstudio',
    modelId: 'local-model',
    endpointUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    badge: 'No Key',
    description: 'Any locally served model via LM Studio.',
    free: true,
  },
];

export const DEFAULT_FREE_MODEL = FREE_MODEL_PRESETS[0];

export function getProviderMeta(id: string): ProviderMeta {
  return (PROVIDER_CATALOG as Record<string, ProviderMeta>)[id] || PROVIDER_CATALOG.custom;
}

/** True when a provider is OpenAI wire-compatible (/chat/completions). */
export function isOpenAICompatible(id: string): boolean {
  return [
    'pollinations',
    'nvidia',
    'groq',
    'openrouter',
    'cerebras',
    'mistral',
    'github',
    'together',
    'openai',
    'deepseek',
    'lmstudio',
    'custom',
    'ollama_local',
    'lmstudio_local',
    'custom_local',
    'ollama',
  ].includes(id);
}
