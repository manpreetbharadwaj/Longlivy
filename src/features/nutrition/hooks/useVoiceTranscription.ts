import { useCallback, useEffect, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export type VoiceTranscriptionStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'no_speech'
  | 'permission_denied'
  | 'network_unavailable'
  | 'error'
  | 'unsupported';

export interface VoiceTranscriptionState {
  status: VoiceTranscriptionStatus;
  /** Finalized segments joined with the in-progress hypothesis for the current utterance appended. */
  transcript: string;
  /** True only while the current utterance's hypothesis hasn't been finalized yet. */
  hasPartial: boolean;
  message: string | null;
}

const NO_SPEECH_MESSAGE = 'No speech detected — try again closer to the microphone.';
const PERMISSION_DENIED_MESSAGE = 'Microphone or speech recognition permission was not granted.';
const NETWORK_MESSAGE = 'Speech recognition needs a network connection on this device.';
const UNSUPPORTED_MESSAGE = 'Speech recognition is not available on this device.';

function errorMessage(error: string, fallback: string): string {
  switch (error) {
    case 'no-speech':
    case 'speech-timeout':
      return NO_SPEECH_MESSAGE;
    case 'not-allowed':
    case 'service-not-allowed':
      return PERMISSION_DENIED_MESSAGE;
    case 'network':
      return NETWORK_MESSAGE;
    case 'language-not-supported':
      return 'This language is not supported for speech recognition.';
    case 'aborted':
      return '';
    default:
      return fallback || 'Speech recognition failed — please try again.';
  }
}

/**
 * Live speech-to-text for Voice Nutrition, built on the device's own native
 * recognizer (Android SpeechRecognizer / iOS SFSpeechRecognizer via
 * expo-speech-recognition) — no network transcription API, no server cost.
 *
 * Finalized utterances accumulate in `finalizedRef`; only the current
 * utterance's still-evolving hypothesis is held separately and replaced (not
 * appended) on every partial result, so a sentence never duplicates itself
 * while the recognizer refines it.
 */
export function useVoiceTranscription(locale = 'en-US'): VoiceTranscriptionState & {
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  setTranscript: (text: string) => void;
} {
  const [status, setStatus] = useState<VoiceTranscriptionStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [finalized, setFinalized] = useState('');
  const [partial, setPartial] = useState('');
  const [edited, setEdited] = useState<string | null>(null);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // Best effort — the native session may already be gone.
    }
  }, []);

  useEffect(() => stop, [stop]);

  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
    setMessage(null);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (!text) return;
    setEdited(null);
    if (event.isFinal) {
      setFinalized((prev) => (prev ? `${prev} ${text}` : text));
      setPartial('');
    } else {
      setPartial(text);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setPartial((current) => {
      if (current) setFinalized((prev) => (prev ? `${prev} ${current}` : current));
      return '';
    });
    setStatus((current) => (current === 'listening' ? 'idle' : current));
  });

  useSpeechRecognitionEvent('error', (event) => {
    const text = errorMessage(event.error, event.message);
    if (event.error === 'aborted') {
      setStatus('idle');
      return;
    }
    setStatus(
      event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'permission_denied'
        : event.error === 'network'
          ? 'network_unavailable'
          : event.error === 'no-speech' || event.error === 'speech-timeout'
            ? 'no_speech'
            : 'error'
    );
    setMessage(text || null);
  });

  const start = useCallback(async () => {
    setEdited(null);
    setFinalized('');
    setPartial('');
    setMessage(null);
    setStatus('requesting_permission');

    let available = true;
    try {
      available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      available = false;
    }
    if (!available) {
      setStatus('unsupported');
      setMessage(UNSUPPORTED_MESSAGE);
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setStatus('permission_denied');
      setMessage(PERMISSION_DENIED_MESSAGE);
      return;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        interimResults: true,
        continuous: true,
      });
    } catch {
      setStatus('error');
      setMessage('Could not start speech recognition — please try again.');
    }
  }, [locale]);

  const reset = useCallback(() => {
    stop();
    setEdited(null);
    setFinalized('');
    setPartial('');
    setStatus('idle');
    setMessage(null);
  }, [stop]);

  const setTranscript = useCallback((text: string) => {
    setEdited(text);
  }, []);

  const transcript = edited !== null ? edited : [finalized, partial].filter(Boolean).join(' ');

  return { status, transcript, hasPartial: partial.length > 0, message, start, stop, reset, setTranscript };
}
