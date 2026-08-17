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
        segmentStart = t;
        pauseStart = null;
        break;
      case 'paused':
      case 'backgrounded':
        if (segmentStart !== null) {
          activeSeconds += (t - segmentStart) / 1000;
          segmentStart = null;
        }
        pauseStart = t;
        break;
      case 'foregrounded':
        // resumes an implicit active segment only if a "resumed" event follows;
        // foregrounded alone does not restart the timer.
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
