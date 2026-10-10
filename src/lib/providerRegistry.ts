import type { AIProviderType, ExternalAIModelConfig, LocalHostConfig } from '../types/workbench';

export type NativeProviderId =
  | AIProviderType
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'groq';

export interface ResolvedProviderConfig {
  provider: NativeProviderId;
  endpointUrl: string;
  modelName: string;
  apiKey: string | null;
}

const EXTERNAL_PROVIDER_IDS: Record<ExternalAIModelConfig['provider'], NativeProviderId> = {
  gemini: 'gemini',
  openai: 'openai',
  anthropic: 'anthropic',
  deepseek: 'deepseek',
  groq: 'groq',
  ollama: 'ollama_local',
  lmstudio: 'lmstudio_local',
  custom: 'custom_local',
};

const DEFAULT_ENDPOINTS: Partial<Record<NativeProviderId, string>> = {
  gemini_cloud: 'https://generativelanguage.googleapis.com',
  gemini: 'https://generativelanguage.googleapis.com',
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama_local: 'http://127.0.0.1:11434',
  lmstudio_local: 'http://127.0.0.1:1234/v1',
};

function nonEmpty(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Resolve the selected model once for every native desktop feature.
 * An explicitly configured model never inherits another model's endpoint or secret.
 */
export function resolveProviderConfig(
  localConfig: LocalHostConfig,
  activeCustomModel?: ExternalAIModelConfig | null,
): ResolvedProviderConfig {
  if (activeCustomModel) {
    const provider = EXTERNAL_PROVIDER_IDS[activeCustomModel.provider];
    const endpointUrl = nonEmpty(activeCustomModel.endpointUrl) || DEFAULT_ENDPOINTS[provider] || '';
    if (provider === 'custom_local' && !endpointUrl) {
      throw new Error('Add the custom compatible provider base URL before sending a request.');
    }
    return {
      provider,
      endpointUrl,
      modelName: nonEmpty(activeCustomModel.modelId),
      // Gemini presets may intentionally use the primary Gemini credential.
      // Other model profiles must never inherit a different provider's key.
      apiKey: nonEmpty(activeCustomModel.apiKey) || (activeCustomModel.provider === 'gemini' ? nonEmpty(localConfig.apiKey) || null : null),
    };
  }

  const provider = localConfig.provider;
  const endpointUrl = nonEmpty(localConfig.endpointUrl) || DEFAULT_ENDPOINTS[provider] || '';
  if (provider === 'custom_local' && !endpointUrl) {
    throw new Error('Add the custom compatible provider base URL before sending a request.');
  }
  return {
    provider,
    endpointUrl,
    modelName: nonEmpty(localConfig.modelName),
    apiKey: nonEmpty(localConfig.apiKey) || null,
  };
}
