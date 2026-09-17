import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { BreathingPhase } from './useBreathingPhaseEngine';
import { resolveBreathingCueSource } from '../breathingCues';

/**
 * Plays a short cue once per phase transition — fully inert today since
 * resolveBreathingCueSource() always returns null (no real cue asset exists
 * yet, see breathingCues.ts). Never attempts a load when there's no source,
 * same safety rule as every other Coming Soon audio path in this feature.
 */
export function useBreathingPhaseCues(phase: BreathingPhase, enabled: boolean): void {
  const cueSource = enabled ? resolveBreathingCueSource(phase) : null;
  const player = useAudioPlayer(cueSource ?? undefined);
  const lastCuedPhaseRef = useRef<BreathingPhase | null>(null);

  useEffect(() => {
    if (!cueSource || lastCuedPhaseRef.current === phase) return;
    lastCuedPhaseRef.current = phase;
    player.seekTo(0).catch(() => {});
    player.play();
  }, [phase, cueSource, player]);
}
