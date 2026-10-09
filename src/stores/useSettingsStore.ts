import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserSettings, PersonaType } from '../types/chat';
import type { ExternalAIModelConfig, LocalHostConfig, AIProviderType } from '../types/workbench';

const SETTINGS_KEY = 'supru_ai_settings_v1';

const DEFAULT_SETTINGS: UserSettings = {
  persona: 'supru_cat',
  temperature: 0.7,
  voiceEnabled: true,
  soundEffects: true,
  userName: 'Ahvan',
  userEmail: 'younuspe@gmail.com',
  isLoggedIn: true,
  avatarSeed: 'supru_cat',
};

const DEFAULT_LOCAL_CONFIG: LocalHostConfig = {
  provider: 'gemini_cloud',
  endpointUrl: 'http://localhost:11434',
  modelName: 'llama3',
  isCustomUrl: false,
};

const API_BASE = '/api';

interface SettingsState {
  settings: UserSettings;
  customModels: ExternalAIModelConfig[];
  activeCustomModel: ExternalAIModelConfig | null;
  localConfig: LocalHostConfig;
  _hasHydrated: boolean;
  storedProviders: string[];
  isLoadingKeys: boolean;
}

interface SettingsActions {
  updateSettings: (partial: Partial<UserSettings>) => void;
  setPersona: (persona: PersonaType) => void;
  setTemperature: (temperature: number) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  addCustomModel: (model: ExternalAIModelConfig, makeActive?: boolean) => void;
  deleteCustomModel: (id: string) => void;
  setActiveCustomModel: (model: ExternalAIModelConfig | null) => void;
  updateLocalConfig: (partial: Partial<LocalHostConfig>) => void;
  setLocalProvider: (provider: AIProviderType, endpointUrl?: string, modelName?: string) => void;
  setHasHydrated: (value: boolean) => void;
  fetchStoredProviders: () => Promise<void>;
  storeApiKey: (provider: string, key: string) => Promise<void>;
  deleteApiKey: (provider: string) => Promise<void>;
  testApiKey: (provider: string, key: string) => Promise<{ status: 'online' | 'offline'; message: string; models?: string[]; latencyMs?: number }>;
}

type SettingsStore = SettingsState & SettingsActions;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${url}`, { ...options, headers });
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      customModels: [],
      activeCustomModel: null,
      localConfig: DEFAULT_LOCAL_CONFIG,
      _hasHydrated: false,
      storedProviders: [],
      isLoadingKeys: false,

      updateSettings: (partial) => set((state) => ({
        settings: { ...state.settings, ...partial },
      })),

      setPersona: (persona) => set((state) => ({
        settings: { ...state.settings, persona },
      })),

      setTemperature: (temperature) => set((state) => ({
        settings: { ...state.settings, temperature },
      })),

      setVoiceEnabled: (voiceEnabled) => set((state) => ({
        settings: { ...state.settings, voiceEnabled },
      })),

      setSoundEffects: (soundEffects) => set((state) => ({
        settings: { ...state.settings, soundEffects },
      })),

      addCustomModel: (model, makeActive = true) => set((state) => {
        const nextModels = [model, ...state.customModels.filter((m) => m.id !== model.id)];
        return {
          customModels: nextModels,
          activeCustomModel: makeActive ? model : state.activeCustomModel,
        };
      }),

      deleteCustomModel: (id) => set((state) => {
        const nextModels = state.customModels.filter((m) => m.id !== id);
        const activeCustomModel = state.activeCustomModel?.id === id ? null : state.activeCustomModel;
        return {
          customModels: nextModels,
          activeCustomModel,
        };
      }),

      setActiveCustomModel: (model) => set({ activeCustomModel: model }),

      updateLocalConfig: (partial) => set((state) => ({
        localConfig: { ...state.localConfig, ...partial },
      })),

      setLocalProvider: (provider, endpointUrl, modelName) => set((state) => ({
        localConfig: {
          ...state.localConfig,
          provider,
          endpointUrl: endpointUrl ?? state.localConfig.endpointUrl,
          modelName: modelName ?? state.localConfig.modelName,
        },
      })),

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      fetchStoredProviders: async () => {
        set({ isLoadingKeys: true });
        try {
          const response = await fetchWithAuth('/keys');
          if (response.ok) {
            const data = await response.json();
            set({ storedProviders: data.providers || [] });
          }
        } catch (error) {
          console.error('Failed to fetch stored providers:', error);
        } finally {
          set({ isLoadingKeys: false });
        }
      },

      storeApiKey: async (provider: string, key: string) => {
        try {
          const response = await fetchWithAuth('/keys', {
            method: 'POST',
            body: JSON.stringify({ provider, key }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to store API key');
          }
          await get().fetchStoredProviders();
        } catch (error) {
          console.error('Failed to store API key:', error);
          throw error;
        }
      },

      deleteApiKey: async (provider: string) => {
        try {
          const response = await fetchWithAuth(`/keys/${provider}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete API key');
          }
          await get().fetchStoredProviders();
        } catch (error) {
          console.error('Failed to delete API key:', error);
          throw error;
        }
      },

      testApiKey: async (provider: string, key: string) => {
        try {
          const response = await fetchWithAuth('/keys/test', {
            method: 'POST',
            body: JSON.stringify({ provider, key }),
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to test API key');
          }
          return await response.json();
        } catch (error) {
          console.error('Failed to test API key:', error);
          throw error;
        }
      },
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        customModels: state.customModels,
        activeCustomModel: state.activeCustomModel,
        localConfig: state.localConfig,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export const useSettings = () => useSettingsStore((state) => state.settings);
export const usePersona = () => useSettingsStore((state) => state.settings.persona);
export const useTemperature = () => useSettingsStore((state) => state.settings.temperature);
export const useSoundEffects = () => useSettingsStore((state) => state.settings.soundEffects);
export const useCustomModels = () => useSettingsStore((state) => state.customModels);
export const useActiveCustomModel = () => useSettingsStore((state) => state.activeCustomModel);
export const useLocalConfig = () => useSettingsStore((state) => state.localConfig);
export const useSettingsHasHydrated = () => useSettingsStore((state) => state._hasHydrated);
export const useStoredProviders = () => useSettingsStore((state) => state.storedProviders);
export const useIsLoadingKeys = () => useSettingsStore((state) => state.isLoadingKeys);
export const useStoreApiKey = () => useSettingsStore((state) => state.storeApiKey);
export const useDeleteApiKey = () => useSettingsStore((state) => state.deleteApiKey);
export const useTestApiKey = () => useSettingsStore((state) => state.testApiKey);
export const useFetchStoredProviders = () => useSettingsStore((state) => state.fetchStoredProviders);
