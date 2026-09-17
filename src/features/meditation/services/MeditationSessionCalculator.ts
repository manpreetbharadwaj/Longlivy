import { MeditationSessionEvent } from '../models';

/**
 * Derives actual active meditation seconds from a session's raw event log
 * (started/paused/resumed/stopped), rather than trusting a naive countdown.
 * Pause intervals are explicitly excluded from active time.
 */
export function calculateActiveSecondsFromEvents(events: MeditationSessionEvent[]): {
  activeSeconds: number;
  pausedSeconds: number;
} {
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let activeSeconds = 0;
  let pausedSeconds = 0;
  let segmentStart: number | null = null;
  let pauseStart: number | null = null;

  for (const event of sorted) {
    const t = new Date(event.timestamp).getTime();
    switch (event.type) {
      case 'started':
      case 'resumed':
        // A 'resumed' closes out whatever pause interval preceded it — without
        // this, the time between 'paused' and 'resumed' was silently dropped
        // instead of counted into pausedSeconds.
        if (pauseStart !== null) {
          pausedSeconds += (t - pauseStart) / 1000;
          pauseStart = null;
        }
        segmentStart = t;
        break;
      case 'paused':
        if (segmentStart !== null) {
          activeSeconds += (t - segmentStart) / 1000;
          segmentStart = null;
        }
        pauseStart = t;
        break;
      case 'backgrounded':
      case 'foregrounded':
        // Informational only — background/lock-screen audio is expected to
        // keep playing (native background-audio mode is configured; see
        // useMeditationAudioSession), so backgrounding is NOT a pause
        // boundary. Only an explicit 'paused' event closes an active
        // segment; these two just record what happened without affecting
        // active/paused duration math.
        break;
      case 'completed':
      case 'stopped':
      case 'interrupted':
        if (segmentStart !== null) {
          activeSeconds += (t - segmentStart) / 1000;
          segmentStart = null;
        }
        if (pauseStart !== null) {
          pausedSeconds += (t - pauseStart) / 1000;
          pauseStart = null;
        }
        break;
      default:
        break;
    }
  }

  return {
    activeSeconds: Math.max(0, Math.round(activeSeconds)),
    pausedSeconds: Math.max(0, Math.round(pausedSeconds)),
  };
}
