import { useState, useRef, useEffect, useCallback } from 'react';
import { soundFx } from './audio';

export interface UseSpeechListenerOptions {
  /** SpeechRecognition accepts one locale per recognizer instance. */
  language?: 'en-US' | 'ml-IN';
  onTranscript?: (text: string) => void;
  onInterim?: (text: string) => void;
  onNotice?: (notice: string | null) => void;
}

export const QUICK_VOICE_PROMPTS = [
  'Build an interactive 3D particle canvas application with physics',
  'Refactor this code into modular, production-grade TypeScript',
  'Fix all runtime errors, add error boundaries, and optimize performance',
  'Synthesize a fullstack dashboard with analytics charts and dark mode',
  'Explain the architecture and data flow of this application',
  'Generate unit tests and validation suites for these functions',
  'Audit this component for security, memory leaks, and edge cases',
];

export function useSpeechListener(options?: UseSpeechListenerOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [audioVolume, setAudioVolume] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isListeningRef = useRef(false);
  const currentTextRef = useRef('');
  const onUpdateCallbackRef = useRef<((text: string) => void) | null>(null);
  const restartTimerRef = useRef<any>(null);

  // Check support
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Clear notice after 5 seconds
  useEffect(() => {
    if (voiceNotice) {
      const timer = setTimeout(() => setVoiceNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [voiceNotice]);

  // Cleanup audio analyzer
  const cleanupAudio = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioVolume(0);
  }, []);

  // Stop listening completely
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    cleanupAudio();
    soundFx.playClick();

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, [cleanupAudio]);

  // Start continuous listening
  const startListening = useCallback(
    async (initialText: string, onUpdate?: (newText: string) => void) => {
      currentTextRef.current = initialText || '';
      if (onUpdate) {
        onUpdateCallbackRef.current = onUpdate;
      }

      // If already listening, stop
      if (isListeningRef.current) {
        stopListening();
        return;
      }

      isListeningRef.current = true;
      setIsListening(true);
      setInterimText('');
      setVoiceNotice('Listening actively... Speak clearly into your microphone.');
      soundFx.playClick();

      // 1. Optional Audio Visualizer (Try getUserMedia, but never fail if denied)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const checkVolume = () => {
              if (!analyserRef.current || !mediaStreamRef.current || !isListeningRef.current) return;
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
              if (isListeningRef.current) {
                requestAnimationFrame(checkVolume);
              }
            };
            requestAnimationFrame(checkVolume);
          }
        } catch (mediaErr: any) {
          // Do not abort! SpeechRecognition might still work in Chrome without getUserMedia
          console.warn('Microphone volume meter unavailable, continuing with SpeechRecognition:', mediaErr.message);
        }
      }

      // 2. Start SpeechRecognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceNotice('Browser SpeechRecognition not supported in this environment. Select a quick voice prompt below or type directly.');
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      const createAndStartRecognition = () => {
        if (!isListeningRef.current) return;

        try {
          const recognition = new SpeechRecognition();
          recognition.lang = options?.language || 'en-US';
          recognition.continuous = true; // Crucial: Keep listening continuously!
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognitionRef.current = recognition;

          recognition.onstart = () => {
            if (isListeningRef.current) {
              setIsListening(true);
              setVoiceNotice('Mic active: Listening for speech...');
            }
          };

          recognition.onresult = (event: any) => {
            let interim = '';
            let newFinal = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptPart = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                newFinal += transcriptPart;
              } else {
                interim += transcriptPart;
              }
            }

            if (newFinal) {
              const trimmed = newFinal.trim();
              const updated = currentTextRef.current
                ? `${currentTextRef.current} ${trimmed}`
                : trimmed;
              currentTextRef.current = updated;
              if (onUpdateCallbackRef.current) {
                onUpdateCallbackRef.current(updated);
              }
              options?.onTranscript?.(updated);
              setInterimText('');
              setVoiceNotice(`Heard: "${trimmed}"`);
            } else if (interim) {
              setInterimText(interim);
              options?.onInterim?.(interim);
              setVoiceNotice(`Listening: "${interim}"`);
            }
          };

          recognition.onerror = (err: any) => {
            console.warn('SpeechRecognition status:', err.error);
            if (err.error === 'no-speech') {
              // Crucial: No speech yet is normal, keep listening!
              setVoiceNotice('Listening actively... Speak when ready.');
            } else if (err.error === 'not-allowed') {
              isListeningRef.current = false;
              setIsListening(false);
              cleanupAudio();
              setVoiceNotice('Microphone access blocked. Please allow microphone in browser URL settings.');
            } else if (err.error === 'network') {
              setVoiceNotice('Speech recognition network service paused. Retrying or select a quick voice prompt.');
            } else if (err.error === 'aborted') {
              // Ignore if intentional
            } else {
              setVoiceNotice(`Voice engine: ${err.error || 'reconnecting'}.`);
            }
          };

          recognition.onend = () => {
            // Crucial: If still in listening mode, automatically reconnect to keep listening!
            if (isListeningRef.current) {
              restartTimerRef.current = setTimeout(() => {
                if (isListeningRef.current) {
                  createAndStartRecognition();
                }
              }, 300);
            } else {
              setIsListening(false);
              cleanupAudio();
            }
          };

          recognition.start();
        } catch (err: any) {
          console.warn('Error starting speech recognition:', err);
          // If already started or browser throws, retry once if still listening
          if (isListeningRef.current) {
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current) {
                createAndStartRecognition();
              }
            }, 600);
          }
        }
      };

      createAndStartRecognition();
    },
    [cleanupAudio, options, stopListening]
  );

  // Apply a quick prompt directly
  const applyQuickPrompt = useCallback(
    (prompt: string, onUpdate?: (newText: string) => void) => {
      soundFx.playClick();
      currentTextRef.current = prompt;
      if (onUpdate) {
        onUpdate.call(null, prompt);
      } else if (onUpdateCallbackRef.current) {
        onUpdateCallbackRef.current(prompt);
      }
      setVoiceNotice(`Voice prompt applied: "${prompt.slice(0, 36)}..."`);
      stopListening();
    },
    [stopListening]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      cleanupAudio();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [cleanupAudio]);

  return {
    isListening,
    interimText,
    audioVolume,
    voiceNotice,
    setVoiceNotice,
    isSpeechSupported,
    startListening,
    stopListening,
    applyQuickPrompt,
    quickPrompts: QUICK_VOICE_PROMPTS,
  };
}
