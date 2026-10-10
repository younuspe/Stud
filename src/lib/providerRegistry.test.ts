import * as assert from 'node:assert/strict';
import type { ExternalAIModelConfig, LocalHostConfig } from '../types/workbench';
import { resolveProviderConfig } from './providerRegistry';

const primaryConfig: LocalHostConfig = {
  provider: 'gemini_cloud',
  endpointUrl: 'https://generativelanguage.googleapis.com',
  modelName: 'gemini-2.5-flash',
  apiKey: 'primary-gemini-secret',
  isCustomUrl: false,
};

function externalModel(overrides: Partial<ExternalAIModelConfig> = {}): ExternalAIModelConfig {
  return {
    id: 'model-openrouter-test',
    name: 'OpenRouter test model',
    provider: 'custom',
    modelId: 'google/gemma-4-31b-it:free',
    endpointUrl: 'https://openrouter.ai/api/v1/chat/completions',
    apiKey: 'openrouter-secret',
    description: 'Test profile',
    isExternal: true,
    status: 'untested',
    ...overrides,
  };
}

const openRouter = resolveProviderConfig(primaryConfig, externalModel());
assert.equal(openRouter.provider, 'custom_local');
assert.equal(openRouter.endpointUrl, 'https://openrouter.ai/api/v1/chat/completions');
assert.equal(openRouter.modelName, 'google/gemma-4-31b-it:free');
assert.equal(openRouter.apiKey, 'openrouter-secret');
assert.notEqual(openRouter.apiKey, primaryConfig.apiKey);

const nvidia = resolveProviderConfig(primaryConfig, externalModel({
  id: 'model-nvidia-test',
  modelId: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  endpointUrl: 'https://integrate.api.nvidia.com/v1',
  apiKey: 'nvidia-secret',
}));
assert.equal(nvidia.provider, 'custom_local');
assert.equal(nvidia.endpointUrl, 'https://integrate.api.nvidia.com/v1');
assert.equal(nvidia.apiKey, 'nvidia-secret');

const openAI = resolveProviderConfig(primaryConfig, externalModel({
  provider: 'openai',
  endpointUrl: '',
  apiKey: 'openai-secret',
}));
assert.equal(openAI.provider, 'openai');
assert.equal(openAI.endpointUrl, 'https://api.openai.com/v1');
assert.equal(openAI.apiKey, 'openai-secret');

const gemini = resolveProviderConfig(primaryConfig, externalModel({
  provider: 'gemini',
  endpointUrl: '',
  apiKey: '',
}));
assert.equal(gemini.provider, 'gemini');
assert.equal(gemini.endpointUrl, 'https://generativelanguage.googleapis.com');
assert.equal(gemini.apiKey, 'primary-gemini-secret');

const ollama = resolveProviderConfig({
  ...primaryConfig,
  provider: 'ollama_local',
  endpointUrl: '',
  modelName: 'qwen2.5-coder:7b',
  apiKey: undefined,
});
assert.equal(ollama.provider, 'ollama_local');
assert.equal(ollama.endpointUrl, 'http://127.0.0.1:11434');
assert.equal(ollama.apiKey, null);

assert.throws(
  () => resolveProviderConfig(primaryConfig, externalModel({ endpointUrl: '' })),
  /base URL/,
);

console.log('Provider registry tests passed: OpenRouter, NVIDIA, OpenAI, Gemini, Ollama, and missing custom endpoint.');
