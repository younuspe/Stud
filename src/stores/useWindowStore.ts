import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StudioWindowId, StudioWindowState } from '../types/workbench';

const STORAGE_KEY = 'supru_studio_windows_v2';

const DEFAULT_STUDIO_WINDOWS: Record<StudioWindowId, StudioWindowState> = {
  editor: { id: 'editor', title: 'Code Editor', isOpen: true, isUndocked: false },
  preview: { id: 'preview', title: 'Live Preview Sandbox', isOpen: true, isUndocked: false },
  generator: { id: 'generator', title: 'AI Code Generator', isOpen: true, isUndocked: false },
  terminal: { id: 'terminal', title: 'Supru CLI / Shell', isOpen: false, isUndocked: false },
  agent: { id: 'agent', title: 'Supru Hunter Agent', isOpen: false, isUndocked: false },
  github: { id: 'github', title: 'GitHub Workspace', isOpen: false, isUndocked: false },
  console: { id: 'console', title: 'Interactive Console', isOpen: false, isUndocked: false },
  orchestrator: { id: 'orchestrator', title: 'Autonomous Model Orchestrator', isOpen: false, isUndocked: false },
};

interface WindowState {
  windows: Record<StudioWindowId, StudioWindowState>;
  _hasHydrated: boolean;
}

interface WindowActions {
  toggleWindow: (id: StudioWindowId) => void;
  toggleUndock: (id: StudioWindowId) => void;
  setWindowOpen: (id: StudioWindowId, isOpen: boolean) => void;
  setWindowUndocked: (id: StudioWindowId, isUndocked: boolean) => void;
  dockAll: () => void;
  resetLayout: () => void;
  setWindowPosition: (id: StudioWindowId, position: { x: number; y: number }) => void;
  setWindowSize: (id: StudioWindowId, size: { width: number; height: number }) => void;
  setHasHydrated: (value: boolean) => void;
}

type WindowStore = WindowState & WindowActions;

export const useWindowStore = create<WindowStore>()(
  persist(
    (set) => ({
      windows: DEFAULT_STUDIO_WINDOWS,
      _hasHydrated: false,

      toggleWindow: (id) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], isOpen: !state.windows[id].isOpen },
        },
      })),

      toggleUndock: (id) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: {
            ...state.windows[id],
            isUndocked: !state.windows[id].isUndocked,
            isOpen: true,
          },
        },
      })),

      setWindowOpen: (id, isOpen) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], isOpen },
        },
      })),

      setWindowUndocked: (id, isUndocked) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], isUndocked },
        },
      })),

      dockAll: () => set((state) => {
        const next = { ...state.windows };
        for (const k of Object.keys(next) as StudioWindowId[]) {
          next[k] = { ...next[k], isUndocked: false };
        }
        return { windows: next };
      }),

      resetLayout: () => set({ windows: DEFAULT_STUDIO_WINDOWS }),

      setWindowPosition: (id, position) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], position },
        },
      })),

      setWindowSize: (id, size) => set((state) => ({
        windows: {
          ...state.windows,
          [id]: { ...state.windows[id], size },
        },
      })),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        windows: state.windows,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export const useStudioWindows = () => useWindowStore((state) => state.windows);
export const useWindowState = (id: StudioWindowId) => useWindowStore((state) => state.windows[id]);
export const useWindowHasHydrated = () => useWindowStore((state) => state._hasHydrated);
