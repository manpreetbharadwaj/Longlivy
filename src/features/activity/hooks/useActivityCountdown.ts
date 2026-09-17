import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityType } from '../models';
import { announce, stopAnnouncements } from '../services/VoiceAnnouncer';

export const PRE_START_COUNTDOWN_SECONDS = 15;

/**
 * Natural-speech subject for "<X> starts in N seconds" — distinct from
 * `ACTIVITY_TYPE_LABELS` (the picker's noun label, e.g. "Running") because
 * "Run starts in 15 seconds" is what the spec asks for, not "Running
 * starts in 15 seconds".
 */
const ACTIVITY_VOICE_SUBJECT: Record<ActivityType, string> = {
  running: 'Run',
  walking: 'Walk',
  cycling: 'Cycling',
  hiking: 'Hike',
  jogging: 'Jog',
  other: 'Activity',
};

interface UseActivityCountdownResult {
  /** Whole seconds left, or `null` when no countdown is running. */
  secondsRemaining: number | null;
  /** Clears every pending timer and stops any in-flight/queued speech immediately. */
  cancel: () => void;
}

/**
 * Drives the ~15s pre-start voice countdown for tracked activities. Purely
 * local/transient state — no Activity record exists yet while this runs,
 * so nothing here touches Redux or the repository (see
 * `ActiveActivityScreen`, which only calls `startActivityThunk` from
 * `onGo`). A single `setInterval` recomputes "seconds remaining" from a
 * fixed deadline timestamp on every tick (never decrements a counter,
 * matching `useActivityTimer`'s convention) and fires each announcement
 * exactly once by comparing against the last-announced value — so a
 * throttled/backgrounded timer can never double-announce or skip silently
 * out of sync with the displayed number.
 */
export function useActivityCountdown(activityType: ActivityType | null, onGo: () => void): UseActivityCountdownResult {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnnouncedRef = useRef<number | null>(null);
  const onGoRef = useRef(onGo);
  onGoRef.current = onGo;

  const cancel = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    stopAnnouncements();
    setSecondsRemaining(null);
  }, []);

  useEffect(() => {
    if (!activityType) {
      cancel();
      return;
    }

    const total = PRE_START_COUNTDOWN_SECONDS;
    const deadline = Date.now() + total * 1000;
    lastAnnouncedRef.current = null;
    setSecondsRemaining(total);
    announce(`${ACTIVITY_VOICE_SUBJECT[activityType]} starts in ${total} seconds.`);

    intervalRef.current = setInterval(() => {
      const remainingMs = deadline - Date.now();
      const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsRemaining(remaining);

      if (remaining !== lastAnnouncedRef.current) {
        lastAnnouncedRef.current = remaining;
        if (remaining === 10) announce('10 seconds.');
        else if (remaining >= 1 && remaining <= 5) announce(String(remaining));
      }

      if (remainingMs <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        announce('Go.');
        onGoRef.current();
      }
    }, 200);

    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityType]);

  return { secondsRemaining, cancel };
}
