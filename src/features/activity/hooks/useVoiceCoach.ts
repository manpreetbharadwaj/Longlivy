import { useEffect, useRef } from 'react';
import { Activity } from '../models';
import { announce } from '../services/VoiceAnnouncer';

/** How often Voice Coach speaks up during an active session, in ms of *active* (pause-excluded) time. */
const COACH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Fallback-only announcer for activities `useBackgroundGpsTracking` never
 * runs for (non-GPS `other` sessions) — every GPS-based activity type
 * (running/walking/cycling/hiking) now gets its distance- and time-milestone
 * announcements from the background location task (see VoiceCoach.ts),
 * which keeps speaking with the screen locked or the app backgrounded; this
 * mounted-only hook could do neither, so it stands down whenever that task
 * owns the session to avoid both of them speaking over each other.
 *
 * Rides on `activeDurationMs` from the existing pause-aware
 * `useActivityTimer` rather than owning a second clock, so it naturally
 * goes quiet on pause and never counts pause time.
 */
export function useVoiceCoach(activity: Activity | null, activeDurationMs: number, enabled = true): void {
  const lastAnnouncedRef = useRef(0);
  const active = enabled && !!activity && activity.status === 'active' && !activity.gpsAvailable;

  useEffect(() => {
    lastAnnouncedRef.current = 0;
  }, [activity?.id]);

  useEffect(() => {
    if (!active) return;
    const elapsedIntervals = Math.floor(activeDurationMs / COACH_INTERVAL_MS);
    if (elapsedIntervals > 0 && elapsedIntervals !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = elapsedIntervals;
      announce(`${elapsedIntervals * 5} minutes.`);
    }
  }, [active, activeDurationMs]);
}
