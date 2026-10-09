import '@testing-library/jest-dom';
import { createRoot } from 'react-dom/client';

// TypeScript declarations for global APIs
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  dispatchEvent: (event: Event) => boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
      prototype: SpeechRecognition;
    };
    SpeechRecognitionEvent: any;
    SpeechRecognitionErrorEvent: any;
  }
}

// Mock SpeechRecognition
class MockSpeechRecognition implements SpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;

  start = jest.fn();
  stop = jest.fn();
  abort = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

global.SpeechRecognition = MockSpeechRecognition as any;
global.webkitSpeechRecognition = MockSpeechRecognition as any;

// Mock AudioContext with proper types
class MockAudioContext {
  state: 'running' | 'suspended' | 'closed' = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination: AudioDestinationNode = {} as AudioDestinationNode;
  listener: AudioListener = {} as AudioListener;

  createBuffer = jest.fn();
  createBufferSource = jest.fn();
  createMediaElementSource = jest.fn();
  createMediaStreamSource = jest.fn();
  createScriptProcessor = jest.fn();
  createAnalyser = jest.fn();
  createGain = jest.fn();
  createDelay = jest.fn();
  createBiquadFilter = jest.fn();
  createWaveShaper = jest.fn();
  createPanner = jest.fn();
  createConvolver = jest.fn();
  createChannelSplitter = jest.fn();
  createChannelMerger = jest.fn();
  createOscillator = jest.fn();
  createPeriodicWave = jest.fn();
  decodeAudioData = jest.fn();
  resume = jest.fn().mockResolvedValue(undefined);
  suspend = jest.fn().mockResolvedValue(undefined);
  close = jest.fn().mockResolvedValue(undefined);
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
}

global.AudioContext = MockAudioContext as any;
global.webkitAudioContext = MockAudioContext as any;

// Mock TextEncoder/TextDecoder (only if not already defined)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(input: string): Uint8Array {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class {
    decode(input: Uint8Array): string {
      return Buffer.from(input).toString('utf8');
    }
  } as any;
}

// Mock createRoot for React 18
global.createRoot = createRoot;
