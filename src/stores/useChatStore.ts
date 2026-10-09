import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatThread, Message, Attachment, ServerStatus } from '../types/chat';
import { useSettingsStore } from './useSettingsStore';
import { useWorkspaceStore } from './useWorkspaceStore';

const STORAGE_KEY = 'supru_ai_threads_v1';

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
        content: 'Explain Shor\'s algorithm and quantum superposition in simple terms.',
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: `*Purrs with quantum resonance* 🐾\n\nThink of a classical computer bit like a coin lying flat on a tabletop: it is stubbornly heads (0) or tails (1). But a **qubit** in quantum superposition? That coin is spinning wildly in mid-air—possessing the probabilities of both states simultaneously until an observer slaps a paw down on it!\n\n### Shor's Algorithm Breakdown\n1. **The Classical Bottleneck**: Factoring large numbers (like RSA 2048-bit keys) takes billions of years on classical supercomputers.\n2. **The Quantum Leap**: Shor's algorithm transforms factoring into *period finding* on a modular exponential function.\n3. **Quantum Fourier Transform (QFT)**: Interference amplifies the correct mathematical period while cancelling out noise.\n\n\`\`\`typescript\n// Conceptual representation of quantum superposition state\ninterface QubitState {\n  alpha: number; // Amplitude for |0>\n  beta: number;  // Amplitude for |1>\n  measure: () => 0 | 1;\n}\n\`\`\`\n\n*Meow to wow!* Once cryptographically relevant quantum computers arrive, classical prime factorization falls in polynomial time instead of exponential. Shall we discuss post-quantum lattice cryptography next?`,
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

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  isGenerating: boolean;
  isConnected: boolean;
  serverStatus: ServerStatus;
  abortController: AbortController | null;
  
  // Modals
  isConnectModalOpen: boolean;
  isAddAIModelModalOpen: boolean;
  isGetCodeModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isLocalModalOpen: boolean;
  isSupruTeamModalOpen: boolean;
  isShareModalOpen: boolean;
  isLoginModalOpen: boolean;
  isHelpModalOpen: boolean;
  isImageStudioOpen: boolean;
  isVeoModalOpen: boolean;
  
  // Image/Veo studio state
  imageStudioPhoto: string | null;
  imageStudioPrompt: string;
  veoPhoto: string | null;
  veoPrompt: string;
  
  _hasHydrated: boolean;
}

interface ChatActions {
  addThread: (thread: ChatThread) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, newTitle: string) => void;
  pinThread: (id: string) => void;
  addMessage: (threadId: string, message: Message) => void;
  updateMessage: (threadId: string, messageId: string, updates: Partial<Message>) => void;
  setActiveThread: (id: string | null) => void;
  setGenerating: (value: boolean) => void;
  clearThreadMessages: (threadId: string) => void;
  setHasHydrated: (value: boolean) => void;
  
  // Connection & server
  setIsConnected: (value: boolean) => void;
  setServerStatus: (status: ServerStatus) => void;
  setAbortController: (controller: AbortController | null) => void;
  
  // Modals
  setIsConnectModalOpen: (value: boolean) => void;
  setIsAddAIModelModalOpen: (value: boolean) => void;
  setIsGetCodeModalOpen: (value: boolean) => void;
  setIsSettingsModalOpen: (value: boolean) => void;
  setIsLocalModalOpen: (value: boolean) => void;
  setIsSupruTeamModalOpen: (value: boolean) => void;
  setIsShareModalOpen: (value: boolean) => void;
  setIsLoginModalOpen: (value: boolean) => void;
  setIsHelpModalOpen: (value: boolean) => void;
  setIsImageStudioOpen: (value: boolean) => void;
  setIsVeoModalOpen: (value: boolean) => void;
  
  // Image/Veo studio
  setImageStudioPhoto: (photo: string | null) => void;
  setImageStudioPrompt: (prompt: string) => void;
  setVeoPhoto: (photo: string | null) => void;
  setVeoPrompt: (prompt: string) => void;
  
  // Complex actions
  sendMessage: (text: string, attachment?: Attachment) => Promise<void>;
  stopGeneration: () => void;
  regenerate: () => void;
  sendMediaToChat: (imageUrl: string, promptText: string) => void;
  animateFromImageStudio: (imageUrl: string, promptText?: string) => void;
  openImageStudio: (image?: string, promptText?: string) => void;
  openVeoStudio: (image?: string, promptText?: string) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: INITIAL_THREADS,
      activeThreadId: 'thread-demo-3',
      isGenerating: false,
      isConnected: true,
      serverStatus: {
        status: 'online',
        hasApiKey: true,
        model: 'gemini-3.8-flash',
        version: '2.5.0',
      },
      abortController: null,
      
      // Modals
      isConnectModalOpen: false,
      isAddAIModelModalOpen: false,
      isGetCodeModalOpen: false,
      isSettingsModalOpen: false,
      isLocalModalOpen: false,
      isSupruTeamModalOpen: false,
      isShareModalOpen: false,
      isLoginModalOpen: false,
      isHelpModalOpen: false,
      isImageStudioOpen: false,
      isVeoModalOpen: false,
      
      // Image/Veo studio state
      imageStudioPhoto: null,
      imageStudioPrompt: '',
      veoPhoto: null,
      veoPrompt: '',
      
      _hasHydrated: false,

      addThread: (thread) => set((state) => ({ threads: [thread, ...state.threads] })),

      deleteThread: (id) => set((state) => {
        const threads = state.threads.filter((t) => t.id !== id);
        let activeThreadId = state.activeThreadId;
        if (activeThreadId === id) {
          activeThreadId = threads.length > 0 ? threads[0].id : null;
        }
        return { threads, activeThreadId };
      }),

      renameThread: (id, newTitle) => set((state) => ({
        threads: state.threads.map((t) =>
          t.id === id ? { ...t, title: newTitle, updatedAt: Date.now() } : t
        ),
      })),

      pinThread: (id) => set((state) => ({
        threads: state.threads.map((t) =>
          t.id === id ? { ...t, isPinned: !t.isPinned } : t
        ),
      })),

      addMessage: (threadId, message) => set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? { ...t, messages: [...t.messages, message], updatedAt: Date.now() }
            : t
        ),
      })),

      updateMessage: (threadId, messageId, updates) => set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, ...updates } : m
                ),
              }
            : t
        ),
      })),

      setActiveThread: (id) => set({ activeThreadId: id }),

      setGenerating: (value) => set({ isGenerating: value }),

      clearThreadMessages: (threadId) => set((state) => ({
        threads: state.threads.map((t) =>
          t.id === threadId ? { ...t, messages: [], updatedAt: Date.now() } : t
        ),
      })),

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // Connection & server
      setIsConnected: (value) => set({ isConnected: value }),
      setServerStatus: (status) => set({ serverStatus: status }),
      setAbortController: (controller) => set({ abortController: controller }),

      // Modals
      setIsConnectModalOpen: (value) => set({ isConnectModalOpen: value }),
      setIsAddAIModelModalOpen: (value) => set({ isAddAIModelModalOpen: value }),
      setIsGetCodeModalOpen: (value) => set({ isGetCodeModalOpen: value }),
      setIsSettingsModalOpen: (value) => set({ isSettingsModalOpen: value }),
      setIsLocalModalOpen: (value) => set({ isLocalModalOpen: value }),
      setIsSupruTeamModalOpen: (value) => set({ isSupruTeamModalOpen: value }),
      setIsShareModalOpen: (value) => set({ isShareModalOpen: value }),
      setIsLoginModalOpen: (value) => set({ isLoginModalOpen: value }),
      setIsHelpModalOpen: (value) => set({ isHelpModalOpen: value }),
      setIsImageStudioOpen: (value) => set({ isImageStudioOpen: value }),
      setIsVeoModalOpen: (value) => set({ isVeoModalOpen: value }),

      // Image/Veo studio
      setImageStudioPhoto: (photo) => set({ imageStudioPhoto: photo }),
      setImageStudioPrompt: (prompt) => set({ imageStudioPrompt: prompt }),
      setVeoPhoto: (photo) => set({ veoPhoto: photo }),
      setVeoPrompt: (prompt) => set({ veoPrompt: prompt }),

      // Complex actions
      sendMessage: async (text: string, attachment?: Attachment) => {
        if (!text.trim() && !attachment) return;

        const { activeThreadId, threads } = get();
        const { settings, localConfig, activeCustomModel } = useSettingsStore.getState();
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
          set((state) => ({ threads: [newThread, ...state.threads] }));
          targetThreadId = newThread.id;
          set({ activeThreadId: newThread.id });
        }

        const userMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: Date.now(),
          ...(attachment ? { attachment } : {}),
        };

        const currentThread = threads.find((t) => t.id === targetThreadId);
        const isFirstMessage = !currentThread || currentThread.messages.length === 0;
        const computedTitle = isFirstMessage ? (text.slice(0, 36) || 'Image Chat') : currentThread.title;

        const updatedMessages = [...(currentThread?.messages || []), userMsg];

        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === targetThreadId
              ? {
                  ...t,
                  title: computedTitle,
                  updatedAt: Date.now(),
                  messages: updatedMessages,
                }
              : t
          ),
        }));

        const assistantMsgId = `asst-${Date.now()}`;
        const initialAssistantMsg: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          persona: settings.persona,
          isStreaming: true,
        };

        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === targetThreadId
              ? {
                  ...t,
                  messages: [...updatedMessages, initialAssistantMsg],
                }
              : t
          ),
        }));

        set({ isGenerating: true });
        const controller = new AbortController();
        set({ abortController: controller });

        try {
          const { settings: s, localConfig: lc, activeCustomModel: customModel } = useSettingsStore.getState();
          
          if (customModel) {
            const isLocal = customModel.provider === 'ollama' || customModel.provider === 'lmstudio' || customModel.provider === 'custom';
            const modelRes = await fetch('/api/local-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                provider: isLocal ? (customModel.provider === 'ollama' ? 'ollama_local' : 'lmstudio_local') : customModel.provider,
                endpointUrl: customModel.endpointUrl || (customModel.provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:1234/v1'),
                modelName: customModel.modelId,
                apiKey: customModel.apiKey,
                temperature: s.temperature,
              }),
            });

            const modelData = await modelRes.json();
            const reply = modelData.reply || `Response from ${customModel.name}`;

            set((state) => ({
              threads: state.threads.map((t) =>
                t.id === targetThreadId
                  ? {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: reply, isStreaming: false } : m
                      ),
                    }
                  : t
              ),
            }));
            return;
          }

          if (lc.provider !== 'gemini_cloud' && lc.provider !== 'offline_core') {
            const localRes = await fetch('/api/local-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                provider: lc.provider,
                endpointUrl: lc.endpointUrl,
                modelName: lc.modelName,
                temperature: s.temperature,
              }),
            });

            const localData = await localRes.json();
            const reply = localData.reply || `Response from local model (${lc.modelName})`;

            set((state) => ({
              threads: state.threads.map((t) =>
                t.id === targetThreadId
                  ? {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: reply, isStreaming: false } : m
                      ),
                    }
                  : t
              ),
            }));
            return;
          }

          // Cloud Gemini streaming flow
          const res = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              messages: updatedMessages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              persona: s.persona,
              temperature: s.temperature,
              attachment: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
            }),
          });

          if (!res.ok || !res.body) {
            throw new Error(`HTTP error ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let streamBuffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            streamBuffer += decoder.decode(value, { stream: true });
            const parts = streamBuffer.split('\n\n');
            streamBuffer = parts.pop() || '';

            for (const part of parts) {
              const trimmed = part.trim();
              if (trimmed.startsWith('data: ')) {
                try {
                  const data = JSON.parse(trimmed.replace(/^data:\s*/, ''));
                  if (data.chunk) {
                    accumulated += data.chunk;
                    set((state) => ({
                      threads: state.threads.map((t) =>
                        t.id === targetThreadId
                          ? {
                              ...t,
                              messages: t.messages.map((m) =>
                                m.id === assistantMsgId ? { ...m, content: accumulated } : m
                              ),
                            }
                          : t
                      ),
                    }));
                  }
                  if (data.done) {
                    break;
                  }
                } catch {
                  // Ignore partial or unparseable JSON safely
                }
              }
            }
          }

          if (streamBuffer.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(streamBuffer.trim().replace(/^data:\s*/, ''));
              if (data.chunk) {
                accumulated += data.chunk;
                set((state) => ({
                  threads: state.threads.map((t) =>
                    t.id === targetThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === assistantMsgId ? { ...m, content: accumulated } : m
                          ),
                        }
                      : t
                  ),
                }));
              }
            } catch {}
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError') {
            set((state) => ({
              threads: state.threads.map((t) =>
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
              ),
            }));
          }
        } finally {
          set({ isGenerating: false });
          set((state) => ({
            threads: state.threads.map((t) =>
              t.id === targetThreadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, isStreaming: false } : m
                    ),
                  }
                : t
            ),
          }));
        }
      },

      stopGeneration: () => {
        const { abortController } = get();
        if (abortController) {
          abortController.abort();
        }
        set({ isGenerating: false });
      },

      regenerate: () => {
        const { activeThreadId, threads, isGenerating } = get();
        if (!activeThreadId || isGenerating) return;
        
        const activeThread = threads.find((t) => t.id === activeThreadId);
        if (!activeThread || activeThread.messages.length === 0) return;

        const msgs = [...activeThread.messages];
        const lastMsg = msgs[msgs.length - 1];

        if (!lastMsg || lastMsg.role !== 'assistant') return;

        msgs.pop();

        const latestUserMsg = msgs[msgs.length - 1];
        if (!latestUserMsg || latestUserMsg.role !== 'user') return;

        set((state) => ({
          threads: state.threads.map((t) => (t.id === activeThreadId ? { ...t, messages: msgs } : t)),
        }));

        get().sendMessage(latestUserMsg.content, latestUserMsg.attachment);
      },

      sendMediaToChat: (imageUrl: string, promptText: string) => {
        const { activeThreadId, threads } = get();
        const { settings } = useSettingsStore.getState();
        useWorkspaceStore.getState().setWorkspaceView('chat');
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
          set((state) => ({ threads: [newThread, ...state.threads] }));
          targetThreadId = newThread.id;
          set({ activeThreadId: newThread.id });
        }

        const assistantMsg: Message = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: `Here is the visual generated with **gemini-3.1-flash-image-preview**:\n\n*"${promptText}"*`,
          timestamp: Date.now(),
          attachment: {
            name: 'Synthesized Artwork.png',
            mimeType: 'image/png',
            data: imageUrl,
          },
        };

        set((state) => ({
          threads: state.threads.map((t) =>
            t.id === targetThreadId
              ? {
                  ...t,
                  updatedAt: Date.now(),
                  messages: [...t.messages, assistantMsg],
                }
              : t
          ),
        }));
      },

      animateFromImageStudio: (imageUrl: string, promptText?: string) => {
        set({ isImageStudioOpen: false });
        set({ veoPhoto: imageUrl });
        set({ veoPrompt: promptText ? `Animate this scene: ${promptText}` : '' });
        set({ isVeoModalOpen: true });
      },

      openImageStudio: (image?: string, promptText?: string) => {
        if (image) set({ imageStudioPhoto: image });
        if (promptText) set({ imageStudioPrompt: promptText });
        set({ isImageStudioOpen: true });
        useWorkspaceStore.getState().setSidebarMobileOpen(false);
      },

      openVeoStudio: (image?: string, promptText?: string) => {
        if (image) set({ veoPhoto: image });
        if (promptText) set({ veoPrompt: promptText });
        set({ isVeoModalOpen: true });
        useWorkspaceStore.getState().setSidebarMobileOpen(false);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        threads: state.threads,
        activeThreadId: state.activeThreadId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);

// Selectors
export const useActiveThread = () =>
  useChatStore((state) => state.threads.find((t) => t.id === state.activeThreadId) || null);

export const useActiveMessages = () =>
  useChatStore((state) => state.threads.find((t) => t.id === state.activeThreadId)?.messages || []);

export const usePinnedThreads = () =>
  useChatStore((state) => state.threads.filter((t) => t.isPinned));

export const useUnpinnedThreads = () =>
  useChatStore((state) => state.threads.filter((t) => !t.isPinned).sort((a, b) => b.updatedAt - a.updatedAt));

export const useIsGenerating = () => useChatStore((state) => state.isGenerating);
export const useActiveThreadId = () => useChatStore((state) => state.activeThreadId);
export const useAllThreads = () => useChatStore((state) => state.threads);
export const useChatHasHydrated = () => useChatStore((state) => state._hasHydrated);
export const useIsConnected = () => useChatStore((state) => state.isConnected);
export const useServerStatus = () => useChatStore((state) => state.serverStatus);

// Modal selectors
export const useIsConnectModalOpen = () => useChatStore((state) => state.isConnectModalOpen);
export const useIsAddAIModelModalOpen = () => useChatStore((state) => state.isAddAIModelModalOpen);
export const useIsGetCodeModalOpen = () => useChatStore((state) => state.isGetCodeModalOpen);
export const useIsSettingsModalOpen = () => useChatStore((state) => state.isSettingsModalOpen);
export const useIsLocalModalOpen = () => useChatStore((state) => state.isLocalModalOpen);
export const useIsSupruTeamModalOpen = () => useChatStore((state) => state.isSupruTeamModalOpen);
export const useIsShareModalOpen = () => useChatStore((state) => state.isShareModalOpen);
export const useIsLoginModalOpen = () => useChatStore((state) => state.isLoginModalOpen);
export const useIsHelpModalOpen = () => useChatStore((state) => state.isHelpModalOpen);
export const useIsImageStudioOpen = () => useChatStore((state) => state.isImageStudioOpen);
export const useIsVeoModalOpen = () => useChatStore((state) => state.isVeoModalOpen);

// Image/Veo selectors
export const useImageStudioPhoto = () => useChatStore((state) => state.imageStudioPhoto);
export const useImageStudioPrompt = () => useChatStore((state) => state.imageStudioPrompt);
export const useVeoPhoto = () => useChatStore((state) => state.veoPhoto);
export const useVeoPrompt = () => useChatStore((state) => state.veoPrompt);
