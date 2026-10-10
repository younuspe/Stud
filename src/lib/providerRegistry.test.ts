import type { ExternalAIModelConfig, LocalHostConfig } from '../types/workbench';
import { resolveProviderConfig } from './providerRegistry';
import { extractCompleteHtml } from './htmlSource';

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertThrows(action: () => unknown, expectedMessage: string): void {
  let thrown: unknown;
  try {
    action();
  } catch (error) {
    thrown = error;
  }
  if (!(thrown instanceof Error) || !thrown.message.includes(expectedMessage)) {
    throw new Error(`Expected an error containing "${expectedMessage}".`);
  }
}

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
assertEqual(openRouter.provider, 'custom_local', 'OpenRouter runtime provider');
assertEqual(openRouter.endpointUrl, 'https://openrouter.ai/api/v1/chat/completions', 'OpenRouter endpoint');
assertEqual(openRouter.modelName, 'google/gemma-4-31b-it:free', 'OpenRouter model ID');
assertEqual(openRouter.apiKey, 'openrouter-secret', 'OpenRouter credential isolation');
if (openRouter.apiKey === primaryConfig.apiKey) throw new Error('OpenRouter must not inherit the primary Gemini credential.');

const nvidia = resolveProviderConfig(primaryConfig, externalModel({
  id: 'model-nvidia-test',
  modelId: 'nvidia/nemotron-3.5-lightning-30b-a3b',
  endpointUrl: 'https://integrate.api.nvidia.com/v1',
  apiKey: 'nvidia-secret',
}));
assertEqual(nvidia.provider, 'custom_local', 'NVIDIA runtime provider');
assertEqual(nvidia.endpointUrl, 'https://integrate.api.nvidia.com/v1', 'NVIDIA endpoint');
assertEqual(nvidia.apiKey, 'nvidia-secret', 'NVIDIA credential');

const openAI = resolveProviderConfig(primaryConfig, externalModel({
  provider: 'openai',
  endpointUrl: '',
  apiKey: 'openai-secret',
}));
assertEqual(openAI.provider, 'openai', 'OpenAI runtime provider');
assertEqual(openAI.endpointUrl, 'https://api.openai.com/v1', 'OpenAI default endpoint');
assertEqual(openAI.apiKey, 'openai-secret', 'OpenAI credential');

const gemini = resolveProviderConfig(primaryConfig, externalModel({
  provider: 'gemini',
  endpointUrl: '',
  apiKey: '',
}));
assertEqual(gemini.provider, 'gemini', 'Gemini runtime provider');
assertEqual(gemini.endpointUrl, 'https://generativelanguage.googleapis.com', 'Gemini default endpoint');
assertEqual(gemini.apiKey, 'primary-gemini-secret', 'Gemini primary credential fallback');

const ollama = resolveProviderConfig({
  ...primaryConfig,
  provider: 'ollama_local',
  endpointUrl: '',
  modelName: 'qwen2.5-coder:7b',
  apiKey: undefined,
});
assertEqual(ollama.provider, 'ollama_local', 'Ollama runtime provider');
assertEqual(ollama.endpointUrl, 'http://127.0.0.1:11434', 'Ollama default endpoint');
assertEqual(ollama.apiKey, null, 'Ollama must not inherit a cloud credential');

assertThrows(
  () => resolveProviderConfig(primaryConfig, externalModel({ endpointUrl: '' })),
  'base URL',
);

const htmlDocument = '<!doctype html><html><head><title>App</title></head><body><button id="go">Go</button></body></html>';
assertEqual(extractCompleteHtml('```html\n' + htmlDocument + '\n```\n\nHere is the updated app.'), htmlDocument, 'HTML extraction with fenced code and trailing commentary');
assertEqual(extractCompleteHtml(`I updated your app:\n${htmlDocument}\nDone.`), htmlDocument, 'HTML extraction with surrounding commentary');
assertEqual(extractCompleteHtml('<!doctype html><html><body>unfinished'), '', 'Reject incomplete HTML response');

console.log('Provider registry and HTML extraction tests passed: OpenRouter, NVIDIA, OpenAI, Gemini, Ollama, missing endpoint, credential isolation, and generated-source parsing.');
