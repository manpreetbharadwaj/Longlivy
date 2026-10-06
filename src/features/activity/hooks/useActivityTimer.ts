import { useEffect, useState } from 'react';
import { Activity } from '../models';
import { calculateActiveDurationMs } from '../services/ActivityCalculator';

interface ActivityTimerState {
  activeDurationMs: number;
}

/**
 * Derives active time from persisted timestamps and pause accounting.  The
 * interval only causes renders; it is never the source of elapsed time, so a
 * delayed JS tick cannot make a session lose or gain duration.
 */
export function getActiveDurationMs(activity: Activity, now = Date.now()): number {
  const endTimestamp = new Date(now).toISOString();
  const openPauseMs = activity.status === 'paused' && activity.pauseStartedTimestamp
    ? Math.max(0, now - new Date(activity.pauseStartedTimestamp).getTime())
    : 0;
  return calculateActiveDurationMs(activity.startTimestamp, endTimestamp, activity.pauseDuration + openPauseMs);
}

export function useActivityTimer(activity: Activity | null): ActivityTimerState {
  const [activeDurationMs, setActiveDurationMs] = useState(0);

  useEffect(() => {
    if (!activity) {
      setActiveDurationMs(0);
      return;
    }

    const tick = () => setActiveDurationMs(getActiveDurationMs(activity));
    tick();
    if (activity.status !== 'active') return;

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activity?.id, activity?.status, activity?.startTimestamp, activity?.pauseDuration, activity?.pauseStartedTimestamp]);

  return { activeDurationMs };
}
