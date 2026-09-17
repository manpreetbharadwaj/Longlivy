import type { AudioSource } from 'expo-audio';
import { BreathingPhase } from './hooks/useBreathingPhaseEngine';

/**
 * Short phase-transition cue sounds (e.g. a soft tone on inhale/exhale) —
 * mirrors meditationAudio.ts's/meditationAmbientAudio.ts's pattern exactly.
 * No real licensed cue asset exists yet, so this map is intentionally empty;
 * adding one later is: place the file, add its key here — no other change.
 * Only 'inhale'/'hold'/'exhale'/'secondHold' are meaningful cue keys;
 * 'preparing'/'completed' never resolve a cue.
 */
export const BREATHING_CUE_AUDIO_SOURCES = {} as const satisfies Record<string, AudioSource>;

export type BreathingCueKey = keyof typeof BREATHING_CUE_AUDIO_SOURCES;

export function resolveBreathingCueSource(phase: BreathingPhase): AudioSource | null {
  if (phase === 'preparing' || phase === 'completed') return null;
  return BREATHING_CUE_AUDIO_SOURCES[phase as BreathingCueKey] ?? null;
}
