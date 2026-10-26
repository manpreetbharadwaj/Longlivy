import { requireNativeModule } from 'expo-modules-core';

interface NativeLonglivyTts {
  speak(text: string, language: string | null, volume: number | null): Promise<void>;
  isReady(): Promise<boolean>;
}

const Native = requireNativeModule<NativeLonglivyTts>('LonglivyTts');

export interface SpeakOptions {
  language?: string | null;
  volume?: number | null;
}

/**
 * Speaks `text` on a TextToSpeech engine bound to the Android Application
 * context rather than the current Activity — see LonglivyTtsModule.kt for
 * why that distinction matters for workout voice coaching specifically.
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return Native.speak(text, options.language ?? null, options.volume ?? null);
}

export function isReady(): Promise<boolean> {
  return Native.isReady();
}
