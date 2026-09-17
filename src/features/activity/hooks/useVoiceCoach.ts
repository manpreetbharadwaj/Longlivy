import { useEffect, useRef } from 'react';
import { Activity } from '../models';
import { announce } from '../services/VoiceAnnouncer';

/** How often Voice Coach speaks up during an active session, in ms of *active* (pause-excluded) time. */
const COACH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Activation point for "Voice Coach interval processing" — wired to fire
 * only once a real Activity is running (never during the pre-start
 * countdown, never while paused), per the countdown spec's "only at Go"
 * requirement. Deliberately minimal: cadence, distance/pace callouts, and
 * per-activity `voiceCoachSettings` haven't been specified yet, so this
 * only announces elapsed active time every 5 minutes as a placeholder —
 * swap the body out once the full Voice Coach spec lands.
 *
 * Rides on `activeDurationMs` from the existing pause-aware
 * `useActivityTimer` rather than owning a second clock, so it naturally
 * goes quiet on pause and never counts pause time.
 */
export function useVoiceCoach(activity: Activity | null, activeDurationMs: number, enabled = true): void {
  const lastAnnouncedRef = useRef(0);

  useEffect(() => {
    lastAnnouncedRef.current = 0;
  }, [activity?.id]);

  useEffect(() => {
    if (!enabled || !activity || activity.status !== 'active') return;
    const elapsedIntervals = Math.floor(activeDurationMs / COACH_INTERVAL_MS);
    if (elapsedIntervals > 0 && elapsedIntervals !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = elapsedIntervals;
      announce(`${elapsedIntervals * 5} minutes.`);
    }
  }, [enabled, activity, activeDurationMs]);
}
