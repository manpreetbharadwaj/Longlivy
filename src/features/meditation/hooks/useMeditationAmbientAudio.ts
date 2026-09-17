import { useCallback, useEffect, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from 'expo-audio';

export interface AmbientAudioController {
  isAvailable: boolean;
  isLoaded: boolean;
  isPlaying: boolean;
  /** Non-null only on a genuine playback/load failure — the Player shows a lightweight message and keeps the primary layer running regardless (Section 34). */
  error: string | null;
  volume: number;
  setVolume: (volume: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

/** Guided sessions default lower so the ambient layer never competes with the voice (Section 13: ~15–30%); Unguided/Breathing callers pass their own default (Section 14). */
export const DEFAULT_AMBIENT_VOLUME_GUIDED = 0.2;
export const DEFAULT_AMBIENT_VOLUME_UNGUIDED = 0.35;

/**
 * Independent audio-session hook for the secondary ambient layer — the
 * "MeditationAmbientAudioService" abstraction, shaped as a hook rather than a
 * class because expo-audio's own player (`useAudioPlayer`) is itself a hook
 * tied to component lifecycle, same reason `useMeditationAudioSession` is a
 * hook rather than a class. Deliberately does NOT own a session timer or
 * dispatch any Redux session/history action — ambient sound is a Player-local
 * enhancement, never a record of its own (Section 26/27). The primary
 * layer's duration/completion stays authoritative; the Player is responsible
 * for calling pause()/stop() here whenever it pauses/stops the primary layer
 * (Section 29) — the two hooks are independent instances, not coupled here.
 */
export function useMeditationAmbientAudio(audioSource: AudioSource | null, initialVolume: number = DEFAULT_AMBIENT_VOLUME_UNGUIDED): AmbientAudioController {
  const isAvailable = audioSource != null;
  const player = useAudioPlayer(audioSource ?? undefined, { updateInterval: 1000 });
  const status = useAudioPlayerStatus(player);
  const [volume, setVolumeState] = useState(initialVolume);

  useEffect(() => {
    player.loop = true;
  }, [player]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  // A source change (including going back to null) or unmount must never
  // leave the previous instance still playing underneath.
  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [audioSource, player]);

  const play = useCallback(() => {
    if (!isAvailable) return; // Coming Soon / unresolved source — never attempt a load, per Section 30.
    try {
      player.play();
    } catch {
      // A failed ambient play must never take the primary layer down with it (Section 34) — the status.error surfaced below is enough for the Player to show a lightweight message.
    }
  }, [isAvailable, player]);

  const pause = useCallback(() => player.pause(), [player]);

  const stop = useCallback(() => {
    player.pause();
    player.seekTo(0).catch(() => {});
  }, [player]);

  const setVolume = useCallback((value: number) => setVolumeState(Math.max(0, Math.min(1, value))), []);

  return {
    isAvailable,
    isLoaded: isAvailable && status.isLoaded,
    isPlaying: isAvailable && status.playing,
    error: isAvailable ? status.error : null,
    volume,
    setVolume,
    play,
    pause,
    stop,
  };
}
