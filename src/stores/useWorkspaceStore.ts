import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WorkspaceView, CodingSpaceLayout } from '../types/workbench';

const SIDEBAR_WIDTH_KEY = 'supru_sidebar_width_v1';
const CODING_LAYOUT_KEY = 'supru_ai_coding_layout_v1';

interface WorkspaceState {
  workspaceView: WorkspaceView;
  codingLayout: CodingSpaceLayout;
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarMobileOpen: boolean;
  activeFileBuffer: { name: string; content: string } | null;
  agentInitialObjective: string;
  _hasHydrated: boolean;
}

interface WorkspaceActions {
  setWorkspaceView: (view: WorkspaceView) => void;
  setCodingLayout: (layout: CodingSpaceLayout) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebarMobile: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  setActiveFileBuffer: (buffer: { name: string; content: string } | null) => void;
  setAgentInitialObjective: (objective: string) => void;
  setHasHydrated: (value: boolean) => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      workspaceView: 'chat',
      codingLayout: 'single',
      isSidebarCollapsed: false,
      sidebarWidth: 300,
      sidebarMobileOpen: false,
      activeFileBuffer: null,
      agentInitialObjective: '',
      _hasHydrated: false,

      setWorkspaceView: (view) => set({ workspaceView: view }),

      setCodingLayout: (layout) => set({ codingLayout: layout }),

      toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(260, width) }),

      toggleSidebarMobile: () => set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),

      setActiveFileBuffer: (buffer) => set({ activeFileBuffer: buffer }),

      setAgentInitialObjective: (objective) => set({ agentInitialObjective: objective }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: 'supru_workspace_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaceView: state.workspaceView,
        codingLayout: state.codingLayout,
        isSidebarCollapsed: state.isSidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        activeFileBuffer: state.activeFileBuffer,
        agentInitialObjective: state.agentInitialObjective,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export const useWorkspaceView = () => useWorkspaceStore((state) => state.workspaceView);
export const useCodingLayout = () => useWorkspaceStore((state) => state.codingLayout);
export const useIsSidebarCollapsed = () => useWorkspaceStore((state) => state.isSidebarCollapsed);
export const useSidebarWidth = () => useWorkspaceStore((state) => state.sidebarWidth);
export const useSidebarMobileOpen = () => useWorkspaceStore((state) => state.sidebarMobileOpen);
export const useActiveFileBuffer = () => useWorkspaceStore((state) => state.activeFileBuffer);
export const useAgentInitialObjective = () => useWorkspaceStore((state) => state.agentInitialObjective);
export const useWorkspaceHasHydrated = () => useWorkspaceStore((state) => state._hasHydrated);
