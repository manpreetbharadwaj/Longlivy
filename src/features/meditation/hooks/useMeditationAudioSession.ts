import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, type AudioSource } from 'expo-audio';

export type MeditationSessionStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed';

export interface MeditationAudioSessionState {
  /** idle: not yet started. loading: audio requested but not ready. playing/paused/completed as their names suggest. */
  status: MeditationSessionStatus;
  hasAudio: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  /** Position within the current (possibly looping) audio file, not the overall session. */
  audioPositionSeconds: number;
  audioDurationSeconds: number;
  audioError: string | null;
  /** Begins loading (if there's audio) and starts the timer + audio together the moment it's ready. */
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Manual exit before completion — stops audio, clears the timer, releases the audio position. */
  stop: () => void;
}

let audioModeConfigured = false;

/**
 * One state machine driving both the meditation session timer and its audio
 * track, so they can never drift apart: the session's `sessionDurationSeconds`
 * is always authoritative (requirement: audio stops the instant the timer
 * hits zero, whether the track is shorter, longer, or about equal to the
 * session), and pause/resume freezes and restores both at once.
 *
 * Looping a short track to fill a longer session is delegated to the native
 * `AudioPlayer.loop` flag rather than manually reseeking on `didJustFinish` —
 * this avoids any JS-side race at the loop boundary.
 */
export function useMeditationAudioSession(audioSource: AudioSource | null, sessionDurationSeconds: number): MeditationAudioSessionState {
  const hasAudio = audioSource != null;
  const player = useAudioPlayer(audioSource ?? undefined, { updateInterval: 250 });
  const playerStatus = useAudioPlayerStatus(player);

  const [status, setStatus] = useState<MeditationSessionStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const wantsToStartRef = useRef(false);

  useEffect(() => {
    if (audioModeConfigured) return;
    audioModeConfigured = true;
    // Background/lock-screen continuation additionally requires native config
    // (iOS `UIBackgroundModes: audio`, Android foreground-service permissions)
    // — confirmed present in the checked-in native projects (ios/HealthyMe/Info.plist
    // has `UIBackgroundModes: [audio]`; android/.../AndroidManifest.xml has the
    // FOREGROUND_SERVICE_MEDIA_PLAYBACK permission + AudioControlsService),
    // matching the `expo-audio` config plugin's default `enableBackgroundPlayback`.
    // Configuration verified by inspection; actual on-device background/lock-screen
    // continuation has not been empirically tested (Phase 4).
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }).catch(() => {});
  }, []);

  useEffect(() => {
    player.loop = true;
  }, [player]);

  // A new track (or leaving/re-entering) should start clean, not resume
  // whatever status/elapsed time the previous audioSource left behind.
  useEffect(() => {
    wantsToStartRef.current = false;
    setStatus('idle');
    setElapsedSeconds(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  const start = useCallback(() => {
    wantsToStartRef.current = true;
    setStatus((prev) => (prev === 'idle' ? (hasAudio ? 'loading' : 'playing') : prev));
  }, [hasAudio]);

  // Audio + timer begin on the same tick: once the track finishes loading
  // (or fails to), flip to "playing" and call player.play() in the same
  // pass rather than starting the countdown while audio is still buffering.
  useEffect(() => {
    if (!wantsToStartRef.current || status !== 'loading') return;
    if (playerStatus.error) {
      console.error('[meditation audio] failed to load track:', playerStatus.error);
      setStatus('playing');
      return;
    }
    if (playerStatus.isLoaded) {
      player.play();
      setStatus('playing');
    }
  }, [status, playerStatus.isLoaded, playerStatus.error, player]);

  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => Math.min(s + 1, sessionDurationSeconds));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, sessionDurationSeconds]);

  // The session duration is authoritative: the moment it elapses, stop the
  // (possibly still-looping) audio immediately rather than letting it finish
  // its current lap.
  useEffect(() => {
    if (status === 'playing' && sessionDurationSeconds > 0 && elapsedSeconds >= sessionDurationSeconds) {
      if (hasAudio) player.pause();
      setStatus('completed');
    }
  }, [status, elapsedSeconds, sessionDurationSeconds, hasAudio, player]);

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'playing') return prev;
      if (hasAudio) player.pause();
      return 'paused';
    });
  }, [hasAudio, player]);

  const resume = useCallback(() => {
    setStatus((prev) => {
      if (prev !== 'paused') return prev;
      if (hasAudio) player.play();
      return 'playing';
    });
  }, [hasAudio, player]);

  const stop = useCallback(() => {
    wantsToStartRef.current = false;
    if (hasAudio) {
      player.pause();
      player.seekTo(0).catch(() => {});
    }
    setStatus('idle');
    setElapsedSeconds(0);
  }, [hasAudio, player]);

  return {
    status,
    hasAudio,
    elapsedSeconds,
    remainingSeconds: Math.max(0, sessionDurationSeconds - elapsedSeconds),
    audioPositionSeconds: hasAudio ? playerStatus.currentTime : 0,
    audioDurationSeconds: hasAudio ? playerStatus.duration : 0,
    audioError: hasAudio ? playerStatus.error : null,
    start,
    pause,
    resume,
    stop,
  };
}
