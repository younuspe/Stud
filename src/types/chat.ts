export type PersonaType = 'supru_cat' | 'standard_ai' | 'code_architect' | 'creative_writer' | 'sovereign_omni';

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachment?: Attachment;
  persona?: PersonaType;
  isStreaming?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  persona?: PersonaType;
  isPinned?: boolean;
}

export interface UserSettings {
  persona: PersonaType;
  temperature: number;
  voiceEnabled: boolean;
  soundEffects: boolean;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  avatarSeed: string;
}

export interface ServerStatus {
  status: string;
  hasApiKey: boolean;
  model: string;
  version: string;
}
