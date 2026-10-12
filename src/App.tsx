/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { StudioHeader } from './components/StudioHeader';
import { HeroLanding } from './components/HeroLanding';
import { ChatMessageList } from './components/ChatMessageList';

// Heavy, route-level workbench views and modals are code-split so the initial
// bundle stays small; each loads on first visit of its workspace view.
const TerminalView = lazy(() => import('./components/workbench/TerminalView').then((m) => ({ default: m.TerminalView })));
const CodeEditorView = lazy(() => import('./components/workbench/CodeEditorView').then((m) => ({ default: m.CodeEditorView })));
const HeadlessAgentView = lazy(() => import('./components/workbench/HeadlessAgentView').then((m) => ({ default: m.HeadlessAgentView })));
const GitHubView = lazy(() => import('./components/workbench/GitHubView').then((m) => ({ default: m.GitHubView })));
const OrchestratorView = lazy(() => import('./components/workbench/OrchestratorView').then((m) => ({ default: m.OrchestratorView })));
const StratifiedTopologyView = lazy(() => import('./components/workbench/StratifiedTopologyView').then((m) => ({ default: m.StratifiedTopologyView })));
const SupruGenerativeStudioView = lazy(() => import('./components/workbench/SupruGenerativeStudioView').then((m) => ({ default: m.SupruGenerativeStudioView })));
const ImageStudioModal = lazy(() => import('./components/media/ImageStudioModal').then((m) => ({ default: m.ImageStudioModal })));
const VeoVideoModal = lazy(() => import('./components/media/VeoVideoModal').then((m) => ({ default: m.VeoVideoModal })));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal').then((m) => ({ default: m.SettingsModal })));
const AddAIModelModal = lazy(() => import('./components/modals/AddAIModelModal').then((m) => ({ default: m.AddAIModelModal })));
const ConnectModal = lazy(() => import('./components/modals/ConnectModal').then((m) => ({ default: m.ConnectModal })));
const GetCodeModal = lazy(() => import('./components/modals/GetCodeModal').then((m) => ({ default: m.GetCodeModal })));
const ShareModal = lazy(() => import('./components/modals/ShareModal').then((m) => ({ default: m.ShareModal })));
const LoginModal = lazy(() => import('./components/modals/LoginModal').then((m) => ({ default: m.LoginModal })));
const HelpModal = lazy(() => import('./components/modals/HelpModal').then((m) => ({ default: m.HelpModal })));
const LocalProviderModal = lazy(() => import('./components/modals/LocalProviderModal').then((m) => ({ default: m.LocalProviderModal })));
const SupruTeamModal = lazy(() => import('./components/modals/SupruTeamModal').then((m) => ({ default: m.SupruTeamModal })));
const MacOSInstallModal = lazy(() => import('./components/modals/MacOSInstallModal').then((m) => ({ default: m.MacOSInstallModal })));
const ChatInputDock = lazy(() => import('./components/ChatInputDock').then((m) => ({ default: m.ChatInputDock })));
const FloatingChatPill = lazy(() => import('./components/FloatingChatPill').then((m) => ({ default: m.FloatingChatPill })));
import { ChatThread, Message, PersonaType, UserSettings, Attachment, ServerStatus } from './types/chat';
import { WorkspaceView, LocalHostConfig, StudioWindowId, StudioWindowState, ExternalAIModelConfig } from './types/workbench';
import { soundFx } from './utils/audio';
import { useToast } from './components/ui/Toast';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { LoadingFallback } from './components/ui/LoadingFallback';
import { PRESET_TEMPLATES } from './components/workbench/editor/presetTemplates';

const STORAGE_KEY_THREADS = 'supru_ai_threads_v1';
const STORAGE_KEY_SETTINGS = 'supru_ai_settings_v1';
const STORAGE_KEY_LOCAL_CONFIG = 'supru_ai_local_config_v1';
const STORAGE_KEY_SIDEBAR_WIDTH = 'supru_sidebar_width_v1';
const STORAGE_KEY_STUDIO_WINDOWS = 'supru_studio_windows_v2';

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

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-demo-1',
    title: 'Quantum computing algorithms',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    isPinned: true,
    persona: 'supru_cat',
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Explain Shor’s algorithm and quantum superposition in simple terms.',
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `*Purrs with quantum resonance* 🐾\n\nThink of a classical computer bit like a coin lying flat on a tabletop: it is stubbornly heads (0) or tails (1). But a **qubit** in quantum superposition? That coin is spinning wildly in mid-air—possessing the probabilities of both states simultaneously until an observer slaps a paw down on it!\n\n### Shor's Algorithm Breakdown\n1. **The Classical Bottleneck**: Factoring large numbers (like RSA 2048-bit keys) takes billions of years on classical supercomputers.\n2. **The Quantum Leap**: Shor’s algorithm transforms factoring into *period finding* on a modular exponential function.\n3. **Quantum Fourier Transform (QFT)**: Interference amplifies the correct mathematical period while cancelling out noise.\n\n\`\`\`typescript\n// Conceptual representation of quantum superposition state\ninterface QubitState {\n  alpha: number; // Amplitude for |0>\n  beta: number;  // Amplitude for |1>\n  measure: () => 0 | 1;\n}\n\`\`\`\n\n*Meow to wow!* Once cryptographically relevant quantum computers arrive, classical prime factorization falls in polynomial time instead of exponential. Shall we discuss post-quantum lattice cryptography next?`,
        timestamp: Date.now() - 3600000 * 2 + 15000,
      },
    ],
  },
  {
    id: 'thread-demo-2',
    title: 'Cyberpunk cat screenplay',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    isPinned: false,
    persona: 'creative_writer',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Give me an opening scene for a neo-noir film where an augmented cat hacks a mega-corp server.',
        timestamp: Date.now() - 86400000,
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `**SCENE START**\n\n**EXT. NEO-SHINJUKU - NIGHT (RAIN)**\n\nNeon holo-billboards bleed chromatic pink and amber into the obsidian puddles of District 9.\n\nOn the edge of the Arasaka-Biotech skyscraper cornice sits **SUPRU**—an augmented tuxedo cat whose left eye hums with an amber-optic reticle.\n\nSupru's cybernetic whiskers twitch, sampling encrypted radio packets in the smog.\n\n**SUPRU (V.O.)**\n*Humans build firewalls with five-thousand-digit keys. But they always forget the ventilation shaft.* \n\nSupru coils silken muscles and leaps. 60 feet down. No parachute. A silent magnetic grapple deploys from the tail, whipping around a heat vent.\n\n*CLINK.* Four padded paws touch the server room glass. Supru taps the biometric laser sensor with an organic claw.\n\n*Access Granted.*\n\n**SCENE END**`,
        timestamp: Date.now() - 86400000 + 10000,
      },
    ],
  },
  {
    id: 'thread-demo-3',
    title: 'React 19 & Tailwind 4 setup',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    isPinned: false,
    persona: 'code_architect',
    messages: [],
  },
];

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

export default function App() {
  // Chat threads
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THREADS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Use defaults
    }
    return INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>('thread-demo-3');

  // User settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Use defaults
    }
    return DEFAULT_SETTINGS;
  });

  // Local / Cloud Provider config
  const [localConfig, setLocalConfig] = useState<LocalHostConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCAL_CONFIG);
      if (saved) return { ...DEFAULT_LOCAL_CONFIG, ...JSON.parse(saved) };
    } catch {
      // Use defaults
    }
    return DEFAULT_LOCAL_CONFIG;
  });

  // Active Workspace View (Supru Chat, Supru Code, Supru CLI, Supru Hunter, Supru Git)
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('chat');

  // Collapsible Left Panel Tab State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Resizable sidebar width
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR_WIDTH);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 260) return val;
      }
    } catch {}
    return 300;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_WIDTH, String(sidebarWidth));
    } catch {}
  }, [sidebarWidth]);

  // Window Management State (Windows Dropdown list open/close, dock/undock)
  const [studioWindows, setStudioWindows] = useState<Record<StudioWindowId, StudioWindowState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDIO_WINDOWS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STUDIO_WINDOWS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDIO_WINDOWS, JSON.stringify(studioWindows));
    } catch {}
  }, [studioWindows]);

  const handleToggleWindow = (id: StudioWindowId) => {
    setStudioWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], isOpen: !prev[id].isOpen },
    }));
  };

  const handleToggleUndockWindow = (id: StudioWindowId) => {
    setStudioWindows((prev) => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        isUndocked: !prev[id].isUndocked,
        isOpen: true,
      },
    }));
  };

  const handleDockAllWindows = () => {
    setStudioWindows((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next) as StudioWindowId[]) {
        next[k] = { ...next[k], isUndocked: false };
      }
      return next;
    });
  };

  const handleResetWindowLayout = () => {
    setStudioWindows(DEFAULT_STUDIO_WINDOWS);
  };

  // File buffer for opening in Supru Code
  const [activeFileBuffer, setActiveFileBuffer] = useState<{ name: string; content: string } | null>(null);

  // Incoming external prompt for Supru Code Copilot (from Floating Chat Pill)
  const [externalEditorPrompt, setExternalEditorPrompt] = useState<{ id: string; text: string } | null>(null);

  // Shared device-viewport for the Code IDE preview (driven by the header View menu)
  const [deviceViewport, setDeviceViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Pending chat prefill (from header Presets/Chat Starters/Directives)
  const [pendingChatPrompt, setPendingChatPrompt] = useState<{ id: string; text: string } | null>(null);

  // Agent target objective buffer
  const [agentInitialObjective, setAgentInitialObjective] = useState<string>('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  // Pending destructive action awaiting confirmation.
  const [pendingConfirm, setPendingConfirm] = useState<null | {
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>(null);

  // Server diagnostics
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    status: 'online',
    hasApiKey: true,
    model: 'gemini-2.5-flash',
    version: '2.5.0',
  });

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddAIModelModalOpen, setIsAddAIModelModalOpen] = useState(false);
  const [isGetCodeModalOpen, setIsGetCodeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [isSupruTeamModalOpen, setIsSupruTeamModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMacOSModalOpen, setIsMacOSModalOpen] = useState(false);

  // Transient provider/status notice shown above the composer.
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Custom AI Models (with or without API key)
  const [customModels, setCustomModels] = useState<ExternalAIModelConfig[]>(() => {
    try {
      const saved = localStorage.getItem('supru_custom_models');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeCustomModel, setActiveCustomModel] = useState<ExternalAIModelConfig | null>(() => {
    try {
      const saved = localStorage.getItem('supru_active_custom_model');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const handleAddCustomModel = (model: ExternalAIModelConfig, makeActive = true) => {
    setCustomModels((prev) => {
      const next = [model, ...prev.filter((m) => m.id !== model.id)];
      try {
        localStorage.setItem('supru_custom_models', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (makeActive) {
      setActiveCustomModel(model);
      try {
        localStorage.setItem('supru_active_custom_model', JSON.stringify(model));
      } catch {}

      if (model.provider === 'ollama' || model.provider === 'lmstudio' || model.provider === 'custom') {
        setLocalConfig((prev) => ({
          ...prev,
          provider: model.provider === 'ollama' ? 'ollama_local' : model.provider === 'lmstudio' ? 'lmstudio_local' : 'custom_local',
          endpointUrl: model.endpointUrl || (model.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'),
          modelName: model.modelId,
          apiKey: model.apiKey,
        }));
      }
    }

    toast.success('Model added', `${model.name} is ready to use.`);
  };

  const handleDeleteCustomModel = (id: string) => {
    const target = customModels.find((m) => m.id === id);
    setPendingConfirm({
      title: 'Remove this model?',
      description: target
        ? `"${target.name}" will be removed from your saved models.`
        : 'This model will be removed from your saved models.',
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => {
        setCustomModels((prev) => {
          const next = prev.filter((m) => m.id !== id);
          try {
            localStorage.setItem('supru_custom_models', JSON.stringify(next));
          } catch {}
          return next;
        });
        if (activeCustomModel?.id === id) {
          setActiveCustomModel(null);
          try {
            localStorage.removeItem('supru_active_custom_model');
          } catch {}
        }
        toast.success('Model removed');
        setPendingConfirm(null);
      },
    });
  };

  // Creative Studio Modals (gemini-2.5-flash-image & veo-3.1-fast-generate-preview)
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [imageStudioPhoto, setImageStudioPhoto] = useState<string | null>(null);
  const [imageStudioPrompt, setImageStudioPrompt] = useState<string>('');

  const [isVeoModalOpen, setIsVeoModalOpen] = useState(false);
  const [veoPhoto, setVeoPhoto] = useState<string | null>(null);
  const [veoPrompt, setVeoPrompt] = useState<string>('');

  // Keyboard shortcut: Ctrl+B / Cmd+B for collapsible left side panel tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenImageStudio = (image?: string, promptText?: string) => {
    if (image) setImageStudioPhoto(image);
    if (promptText) setImageStudioPrompt(promptText);
    setIsImageStudioOpen(true);
    setSidebarMobileOpen(false);
  };

  const handleOpenVeoStudio = (image?: string, promptText?: string) => {
    if (image) setVeoPhoto(image);
    if (promptText) setVeoPrompt(promptText);
    setIsVeoModalOpen(true);
    setSidebarMobileOpen(false);
  };

  const handleAnimateFromImageStudio = (imageUrl: string, promptText?: string) => {
    setIsImageStudioOpen(false);
    setVeoPhoto(imageUrl);
    setVeoPrompt(promptText ? `Animate this scene: ${promptText}` : '');
    setIsVeoModalOpen(true);
  };

  const handleSendMediaToChat = (imageUrl: string, promptText: string) => {
    setWorkspaceView('chat');
    let targetThreadId = activeThreadId;
    if (!targetThreadId) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: promptText.slice(0, 30) || 'Image Creation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        persona: settings.persona,
      };
      setThreads((prev) => [newThread, ...prev]);
      targetThreadId = newThread.id;
      setActiveThreadId(newThread.id);
    }

    const assistantMsg: Message = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: `Here is the visual generated with **gemini-2.5-flash-image**:\n\n*"${promptText}"*`,
      timestamp: Date.now(),
      attachment: {
        name: 'Synthesized Artwork.png',
        mimeType: 'image/png',
        data: imageUrl,
      },
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === targetThreadId
          ? {
              ...t,
              updatedAt: Date.now(),
              messages: [...t.messages, assistantMsg],
            }
          : t
      )
    );
  };

  useEffect(() => {
    soundFx.enabled = settings.soundEffects;
  }, [settings.soundEffects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
    } catch {
      // LocalStorage error
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // LocalStorage error
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_CONFIG, JSON.stringify(localConfig));
    } catch {
      // LocalStorage error
    }
  }, [localConfig]);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setServerStatus(data);
          setIsConnected(true);
        }
      })
      .catch(() => {
        setIsConnected(true);
      });
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;
  const activeMessages = activeThread?.messages || [];

  const handleNewChat = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      persona: settings.persona,
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setSidebarMobileOpen(false);
    setWorkspaceView('chat');
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    setSidebarMobileOpen(false);
    setWorkspaceView('chat');
  };

  const handleDeleteThread = (id: string) => {
    const target = threads.find((t) => t.id === id);
    setPendingConfirm({
      title: 'Delete this conversation?',
      description: target
        ? `"${target.title}" and its ${target.messages.length} message${
            target.messages.length === 1 ? '' : 's'
          } will be removed. This cannot be undone.`
        : 'This conversation will be permanently removed.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setThreads((prev) => prev.filter((t) => t.id !== id));
        if (activeThreadId === id) {
          const remaining = threads.filter((t) => t.id !== id);
          setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success('Conversation deleted');
        setPendingConfirm(null);
      },
    });
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle, updatedAt: Date.now() } : t))
    );
  };

  const handleTogglePinThread = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  const handleClearCurrentChat = () => {
    if (!activeThreadId) return;
    const target = threads.find((t) => t.id === activeThreadId);
    if (!target || target.messages.length === 0) {
      toast.info('Nothing to clear', 'This conversation is already empty.');
      return;
    }
    setPendingConfirm({
      title: 'Clear this conversation?',
      description: `All ${target.messages.length} messages in "${target.title}" will be removed. The conversation itself is kept.`,
      confirmLabel: 'Clear messages',
      destructive: true,
      onConfirm: () => {
        setThreads((prev) =>
          prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [], updatedAt: Date.now() } : t))
        );
        toast.success('Conversation cleared');
        setPendingConfirm(null);
      },
    });
  };

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (!text.trim() && !attachment) return;

    let targetThreadId = activeThreadId;

    if (!targetThreadId || !threads.some((t) => t.id === targetThreadId)) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: text.slice(0, 30) || 'Image analysis',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        persona: settings.persona,
      };
      setThreads((prev) => [newThread, ...prev]);
      targetThreadId = newThread.id;
      setActiveThreadId(newThread.id);
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachment,
    };

    const currentThread = threads.find((t) => t.id === targetThreadId);
    const isFirstMessage = !currentThread || currentThread.messages.length === 0;
    const computedTitle = isFirstMessage ? (text.slice(0, 36) || 'Image Chat') : currentThread.title;

    const updatedMessages = [...(currentThread?.messages || []), userMsg];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === targetThreadId
          ? {
              ...t,
              title: computedTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : t
      )
    );

    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      persona: settings.persona,
      isStreaming: true,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === targetThreadId
          ? {
              ...t,
              messages: [...updatedMessages, initialAssistantMsg],
            }
          : t
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    let responseProvider: string | undefined;
    let responseModel: string | undefined;

    try {
      // Resolve the active provider (explicitly added model wins, else local config).
      const providerPayload: Record<string, unknown> = activeCustomModel
        ? {
            provider: activeCustomModel.provider,
            modelId: activeCustomModel.modelId,
            apiKey: activeCustomModel.apiKey,
            endpointUrl: activeCustomModel.endpointUrl,
          }
        : localConfig.provider !== 'gemini_cloud' && localConfig.provider !== 'offline_core'
        ? {
            provider: localConfig.provider,
            modelId: localConfig.modelName,
            apiKey: localConfig.apiKey,
            endpointUrl: localConfig.endpointUrl,
          }
        : {};

      // Streaming flow (works for Gemini and every OpenAI-compatible provider).
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: settings.persona,
          temperature: settings.temperature,
          attachment: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          ...providerPayload,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let streamBuffer = '';
      let providerNotice = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const parts = streamBuffer.split('\n\n');
        // Retain the last incomplete part in the buffer
        streamBuffer = parts.pop() || '';

        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.replace(/^data:\s*/, ''));
              if (data.notice) {
                providerNotice = data.notice;
              }
              if (data.chunk) {
                accumulated += data.chunk;
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === targetThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: accumulated } : m
                          ),
                        }
                      : t
                  )
                );
              }
              if (data.done) {
                if (data.provider) responseProvider = data.provider;
                if (data.model) responseModel = data.model;
                break;
              }
            } catch {
              // Ignore partial or unparseable JSON safely
            }
          }
        }
      }

      // Handle any trailing buffer content if present
      if (streamBuffer.trim().startsWith('data: ')) {
        try {
          const data = JSON.parse(streamBuffer.trim().replace(/^data:\s*/, ''));
          if (data.chunk) {
            accumulated += data.chunk;
            setThreads((prev) =>
              prev.map((t) =>
                t.id === targetThreadId
                  ? {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: accumulated } : m
                      ),
                    }
                  : t
              )
            );
          }
        } catch {}
      }

      // Surface a notice when the selected provider could not be reached.
      if (providerNotice) {
        setStatusNotice(
          `${activeCustomModel?.name || localConfig.modelName || 'Provider'} unreachable — using the built-in engine. (${providerNotice})`
        );
      } else {
        setStatusNotice(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Generation failed', 'The model could not be reached. Check your provider settings and try again.');
        setThreads((prev) =>
          prev.map((t) =>
            t.id === targetThreadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            `*Purrs gently* 🐾 I encountered a brief neural flicker, but I'm ready to continue our journey! Try submitting your prompt once more.`,
                          isStreaming: false,
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    } finally {
      setIsGenerating(false);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === targetThreadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        provider: responseProvider ?? m.provider,
                        model: responseModel ?? m.model,
                      }
                    : m
                ),
              }
            : t
        )
      );
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    if (!activeThread || activeThread.messages.length === 0 || isGenerating) return;

    const msgs = [...activeThread.messages];
    const lastMsg = msgs[msgs.length - 1];

    if (lastMsg.role === 'assistant') {
      msgs.pop();
    }

    const latestUserMsg = msgs[msgs.length - 1];
    if (!latestUserMsg || latestUserMsg.role !== 'user') return;

    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? { ...t, messages: msgs } : t))
    );

    handleSendMessage(latestUserMsg.content, latestUserMsg.attachment);
  };

  const handleTriggerAgent = (objective: string) => {
    setAgentInitialObjective(objective);
    setWorkspaceView('agent');
  };

  const handleOpenInEditor = (fileName: string, content: string) => {
    setActiveFileBuffer({ name: fileName, content });
    setWorkspaceView('editor');
  };

  // Chat code blocks hand us (code, language); derive a filename from the language.
  const handleOpenCodeInEditor = (code: string, language: string) => {
    const ext = language === 'typescript' || language === 'ts' ? 'ts'
      : language === 'javascript' || language === 'js' ? 'js'
      : language === 'python' || language === 'py' ? 'py'
      : language === 'rust' || language === 'rs' ? 'rs'
      : language === 'css' ? 'css'
      : language === 'json' ? 'json'
      : 'html';
    handleOpenInEditor(`snippet.${ext}`, code);
  };

  // Header preset templates load a ready-made file straight into the Code IDE.
  const handleSelectPresetTemplate = (templateId: string) => {
    const template = PRESET_TEMPLATES.find((t) => t.file.id === templateId);
    if (!template) return;
    soundFx.playChime();
    setActiveFileBuffer({ name: template.file.name, content: template.file.content });
    setWorkspaceView('editor');
    toast.success('Preset loaded', template.name);
  };

  // Header chat starters / directives prefill the chat composer for review.
  const handleApplyDirective = (directive: string) => {
    setPendingChatPrompt({ id: `chat-${Date.now()}`, text: directive });
    setWorkspaceView('chat');
  };

  const handleDownloadFile = () => {
    soundFx.playClick();
    const content =
      activeFileBuffer?.content ||
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Supru Project</title>\n</head>\n<body>\n  <h1>Welcome to Supru Ecosystem</h1>\n</body>\n</html>`;
    const fileName = activeFileBuffer?.name || 'supru-project.html';
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      soundFx.playChime();
      toast.success('File downloaded', fileName);
    } catch {
      toast.error('Download failed', 'The file could not be saved. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#08080a] text-[#f1f2f6] overflow-hidden">
      <Suspense fallback={<LoadingFallback />}>
      {/* UNIFIED 2027 STUDIO HEADER (File, Edit, View, Windows Dropdown, Models, Presets, View Switcher) */}
      <StudioHeader
        onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleCollapseSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeWorkspaceView={workspaceView}
        onChangeWorkspaceView={setWorkspaceView}
        windows={studioWindows}
        onToggleWindow={handleToggleWindow}
        onToggleUndockWindow={handleToggleUndockWindow}
        onDockAllWindows={handleDockAllWindows}
        onResetWindowLayout={handleResetWindowLayout}
        onNewChat={handleNewChat}
        onNewFile={() => {
          setWorkspaceView('editor');
        }}
        onDownloadFile={handleDownloadFile}
        onClearChat={handleClearCurrentChat}
        activePersona={settings.persona}
        onChangePersona={(p) => setSettings((s) => ({ ...s, persona: p }))}
        userSettings={settings}
        activeProvider={localConfig.provider}
        isConnected={isConnected}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenLocalSettings={() => setIsLocalModalOpen(true)}
        onOpenSupruTeam={() => setIsSupruTeamModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenImageStudio={() => handleOpenImageStudio()}
        onOpenVeoStudio={() => handleOpenVeoStudio()}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEffects: !s.soundEffects }))}
        onOpenConnectModel={() => setIsConnectModalOpen(true)}
        onOpenAddModels={() => setIsAddAIModelModalOpen(true)}
        activeModelName={activeCustomModel?.name || (localConfig.provider !== 'gemini_cloud' ? localConfig.modelName : 'Gemini 2.5 Flash')}
        onOpenGetCode={() => setIsGetCodeModalOpen(true)}
        onOpenMacOSInstall={() => setIsMacOSModalOpen(true)}
        onSelectPresetTemplate={handleSelectPresetTemplate}
        onApplyDirective={handleApplyDirective}
        deviceViewport={deviceViewport}
        onChangeDeviceViewport={setDeviceViewport}
      />

      {/* Main Workspace Frame */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Collapsible Left Side Panel Tab & Sidebar with Resizable Width */}
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewChat={handleNewChat}
          onDeleteThread={handleDeleteThread}
          onRenameThread={handleRenameThread}
          onTogglePinThread={handleTogglePinThread}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenConnect={() => setIsConnectModalOpen(true)}
          onOpenLocalSettings={() => setIsLocalModalOpen(true)}
          onOpenSupruTeam={() => setIsSupruTeamModalOpen(true)}
          onOpenImageStudio={() => handleOpenImageStudio()}
          onOpenVeoStudio={() => handleOpenVeoStudio()}
          isConnected={isConnected}
          userSettings={settings}
          isOpen={sidebarMobileOpen}
          onToggleOpen={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeWorkspaceView={workspaceView}
          onChangeWorkspaceView={setWorkspaceView}
          sidebarWidth={sidebarWidth}
          onUpdateSidebarWidth={setSidebarWidth}
          onOpenMacOSInstall={() => setIsMacOSModalOpen(true)}
        />

        {/* Dynamic Studio Workspace Body with Sovereign Ambient Backlight Glow */}
        <div className="relative flex flex-1 flex-col h-full overflow-hidden bg-[#050508]">
          {/* Sovereign Dynamic Bloom Backlight (Changes color per active module) */}
          <div
            className="pointer-events-none absolute -top-32 left-1/4 h-[500px] w-[600px] rounded-full transition-all duration-700 ease-out z-0"
            style={{
              backgroundColor: 
                workspaceView === 'chat' ? 'rgba(245, 158, 11, 0.08)' :
                workspaceView === 'generative' ? 'rgba(236, 72, 153, 0.1)' :
                workspaceView === 'editor' ? 'rgba(6, 182, 212, 0.08)' :
                workspaceView === 'terminal' ? 'rgba(16, 185, 129, 0.08)' :
                workspaceView === 'agent' ? 'rgba(139, 92, 246, 0.08)' :
                workspaceView === 'github' ? 'rgba(239, 68, 68, 0.08)' :
                workspaceView === 'orchestrator' ? 'rgba(244, 63, 94, 0.08)' :
                'rgba(217, 70, 239, 0.09)',
              filter: 'blur(150px)',
            }}
          />

          {/* Active Workspace View Body */}
          <main className="relative flex flex-1 flex-col overflow-hidden z-10">
            {/* 1. SUPRU CHAT */}
            {workspaceView === 'chat' && (
              <div className="flex h-full w-full flex-col overflow-hidden">
                {activeMessages.length === 0 ? (
                  <HeroLanding
                    onSendMessage={handleSendMessage}
                    activePersona={settings.persona}
                    onOpenImageStudio={(img) => handleOpenImageStudio(img)}
                    onOpenVeoStudio={(img) => handleOpenVeoStudio(img)}
                    onOpenAIStudio={() => {
                      soundFx.playClick();
                      setWorkspaceView('editor');
                    }}
                    onOpenGenerativeStudio={() => {
                      soundFx.playClick();
                      setWorkspaceView('generative');
                    }}
                    onOpenMacOSInstall={() => setIsMacOSModalOpen(true)}
                  />
                ) : (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {statusNotice && (
                      <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                        <span className="mt-0.5">⚠️</span>
                        <span className="flex-1">{statusNotice}</span>
                        <button
                          onClick={() => setStatusNotice(null)}
                          className="text-amber-300/70 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <ChatMessageList
                      messages={activeMessages}
                      isGenerating={isGenerating}
                      onRegenerate={handleRegenerate}
                      onAnimateWithVeo={(img) => handleOpenVeoStudio(img)}
                      onEditWithImageStudio={(img) => handleOpenImageStudio(img)}
                      onOpenInEditor={handleOpenCodeInEditor}
                    />
                    <ChatInputDock
                      onSendMessage={handleSendMessage}
                      isGenerating={isGenerating}
                      onStopGeneration={handleStopGeneration}
                      onOpenImageStudio={(img) => handleOpenImageStudio(img)}
                      onOpenVeoStudio={(img) => handleOpenVeoStudio(img)}
                      onOpenGenerativeStudio={() => {
                        soundFx.playClick();
                        setWorkspaceView('generative');
                      }}
                      pendingPrompt={pendingChatPrompt}
                      onConsumePendingPrompt={() => setPendingChatPrompt(null)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. SUPRU GENERATIVE STUDIO (GENESIS PROTOCOL) */}
            {workspaceView === 'generative' && (
              <SupruGenerativeStudioView
                onSendToChat={(text, img) => {
                  handleSendMessage(text, img ? { name: 'manifestation.png', mimeType: 'image/png', data: img } : undefined);
                  setWorkspaceView('chat');
                }}
                onOpenInEditor={handleOpenInEditor}
                onRunInTerminal={(cmd) => {
                  window.dispatchEvent(new CustomEvent('supru-run-terminal-command', { detail: cmd }));
                  setWorkspaceView('terminal');
                }}
                onOpenImageStudio={(img) => handleOpenImageStudio(img)}
                onOpenVeoStudio={(img) => handleOpenVeoStudio(img)}
                localConfig={localConfig}
                activeCustomModel={activeCustomModel}
              />
            )}

            {/* 3. SUPRU CODE (MULTI-LANGUAGE IDE & ADJUSTABLE DOCKABLE WINDOWS) */}
            {workspaceView === 'editor' && (
              <CodeEditorView
                onRunInTerminal={(command) => {
                  window.dispatchEvent(new CustomEvent('supru-run-terminal-command', { detail: command }));
                  setWorkspaceView('terminal');
                }}
                onSendToChat={(codePrompt) => {
                  setExternalEditorPrompt({ id: `prompt-${Date.now()}`, text: codePrompt });
                }}
                externalPrompt={externalEditorPrompt}
                onClearExternalPrompt={() => setExternalEditorPrompt(null)}
                localConfig={localConfig}
                onOpenLocalSettings={() => setIsLocalModalOpen(true)}
                onTriggerAgent={handleTriggerAgent}
                activeFileBuffer={activeFileBuffer}
                windows={studioWindows}
                onToggleWindow={handleToggleWindow}
                onToggleUndockWindow={handleToggleUndockWindow}
                onDockAllWindows={handleDockAllWindows}
                onResetWindowLayout={handleResetWindowLayout}
                onOpenConnectModel={() => setIsConnectModalOpen(true)}
                onOpenGetCode={() => setIsGetCodeModalOpen(true)}
                onOpenAddModels={() => setIsAddAIModelModalOpen(true)}
                activeModelName={activeCustomModel?.name || (localConfig.provider !== 'gemini_cloud' ? localConfig.modelName : 'Gemini 2.5 Flash')}
                activeCustomModel={activeCustomModel}
                deviceViewport={deviceViewport}
                onChangeDeviceViewport={setDeviceViewport}
              />
            )}

            {/* 3. SUPRU CLI (TERMINAL & SHELL) */}
            {workspaceView === 'terminal' && (
              <TerminalView
                localConfig={localConfig}
                onOpenLocalSettings={() => setIsLocalModalOpen(true)}
                onOpenEditorWithFile={handleOpenInEditor}
                onTriggerAgent={handleTriggerAgent}
              />
            )}

            {/* 4. SUPRU HUNTER (HEADLESS DEVELOPING STUDIO AGENT) */}
            {workspaceView === 'agent' && (
              <HeadlessAgentView
                initialObjective={agentInitialObjective}
                onSendToChat={(report) => {
                  handleSendMessage(report);
                  setWorkspaceView('chat');
                }}
                onOpenInEditor={handleOpenInEditor}
              />
            )}

            {/* 5. SUPRU GIT (GITHUB REPOSITORY INTEGRATION) */}
            {workspaceView === 'github' && (
              <GitHubView
                onOpenInEditor={handleOpenInEditor}
                onTriggerAgent={handleTriggerAgent}
                serverTokenAvailable={serverStatus.hasGithubToken}
              />
            )}

            {/* 6. SUPRU ORCHESTRATOR (AUTONOMOUS MULTI-MODEL WORKFLOW PIPELINE & TOOL CALLING) */}
            {workspaceView === 'orchestrator' && (
              <OrchestratorView
                localConfig={localConfig}
                onOpenLocalSettings={() => setIsLocalModalOpen(true)}
                onOpenInEditor={handleOpenInEditor}
                onTriggerHunter={handleTriggerAgent}
                onSendToChat={(text) => {
                  handleSendMessage(text);
                  setWorkspaceView('chat');
                }}
                onChangeWorkspaceView={setWorkspaceView}
              />
            )}

            {/* 7. THE STRATIFIED STACK (v1.3.0 - MANIFOLD ⊗ FORMULA & GLIDER LOGIC) */}
            {workspaceView === 'topology' && (
              <StratifiedTopologyView
                onSendToChat={(text) => {
                  handleSendMessage(text);
                  setWorkspaceView('chat');
                }}
                onOpenInEditor={handleOpenInEditor}
                onChangeWorkspaceView={setWorkspaceView}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <SupruTeamModal
        isOpen={isSupruTeamModalOpen}
        onClose={() => setIsSupruTeamModalOpen(false)}
        onSelectAgent={setWorkspaceView}
        onOpenImageStudio={() => handleOpenImageStudio()}
        onOpenVeoStudio={() => handleOpenVeoStudio()}
      />

      <LocalProviderModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        config={localConfig}
        onUpdateConfig={(newCfg) => setLocalConfig((prev) => ({ ...prev, ...newCfg }))}
      />

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        isConnected={isConnected}
        onToggleConnect={() => setIsConnected(!isConnected)}
        serverInfo={serverStatus}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
        onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        activeThread={activeThread}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        userSettings={settings}
        onUpdateUserSettings={(newS) => setSettings((prev) => ({ ...prev, ...newS }))}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Native macOS Universal Installer (.dmg) Modal */}
      <MacOSInstallModal
        isOpen={isMacOSModalOpen}
        onClose={() => setIsMacOSModalOpen(false)}
      />

      {/* Gemini 3.1 Flash Image Studio Modal */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        initialSourceImage={imageStudioPhoto}
        initialPrompt={imageStudioPrompt}
        onAnimateWithVeo={handleAnimateFromImageStudio}
        onSendToChat={handleSendMediaToChat}
      />

      {/* Veo 3.1 Fast Video Animation Modal */}
      <VeoVideoModal
        isOpen={isVeoModalOpen}
        onClose={() => setIsVeoModalOpen(false)}
        initialPhotoUrl={veoPhoto}
        initialPrompt={veoPrompt}
      />

      {/* Universal Floating Chat Pill (Can move across any tab, link Supru Code, open any ecosystem tool) */}
      {workspaceView !== 'chat' && (
        <FloatingChatPill
          onSendMessage={(text, attachment) => {
            if (workspaceView === 'editor') {
              // User is chatting in Supru Code -> Send directly to Supru Code Copilot! Never redirect to chat!
              setExternalEditorPrompt({ id: `prompt-${Date.now()}`, text });
              return;
            }
            handleSendMessage(text, attachment);
            setWorkspaceView('chat');
          }}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          activeWorkspaceView={workspaceView}
          onChangeWorkspaceView={setWorkspaceView}
          onOpenImageStudio={() => handleOpenImageStudio()}
          onOpenVeoStudio={() => handleOpenVeoStudio()}
          onOpenAddModels={() => setIsAddAIModelModalOpen(true)}
          activeModelName={activeCustomModel?.name || (localConfig.provider !== 'gemini_cloud' ? localConfig.modelName : 'Gemini 2.5 Flash')}
        />
      )}

      {/* Add Custom AI Models Modal (With or Without API Key) */}
      <AddAIModelModal
        isOpen={isAddAIModelModalOpen}
        onClose={() => setIsAddAIModelModalOpen(false)}
        onAddModel={handleAddCustomModel}
        onSelectModel={(model) => handleAddCustomModel(model, true)}
        onDeleteModel={handleDeleteCustomModel}
        existingModels={customModels}
        activeModelId={activeCustomModel?.id}
      />

      {/* Confirmation gate for destructive actions */}
      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description}
        confirmLabel={pendingConfirm?.confirmLabel}
        destructive={pendingConfirm?.destructive}
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />

      {/* Get Code Export Modal */}
      <GetCodeModal
        isOpen={isGetCodeModalOpen}
        onClose={() => setIsGetCodeModalOpen(false)}
        activeModel={activeCustomModel ? {
          id: activeCustomModel.id,
          name: activeCustomModel.name,
          provider: activeCustomModel.provider,
          modelId: activeCustomModel.modelId,
          apiKey: activeCustomModel.apiKey,
          endpointUrl: activeCustomModel.endpointUrl,
          description: activeCustomModel.description || '',
          isExternal: true,
          status: 'online',
        } : {
          id: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          provider: 'gemini',
          modelId: 'gemini-2.5-flash',
          description: 'Official Google Gemini 2.5 Flash Engine',
          isExternal: false,
          status: 'online',
        }}
        settings={{
          temperature: settings.temperature,
          maxOutputTokens: 8192,
          systemInstruction: 'You are Supru AI, an autonomous software engineering and generative studio system.',
          topP: 0.95,
        }}
        currentPrompt={activeMessages[activeMessages.length - 1]?.content || ''}
      />
      </Suspense>
    </div>
  );
}
