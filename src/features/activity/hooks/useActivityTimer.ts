import { useEffect, useRef, useState } from 'react';
import { Activity } from '../models';

interface ActivityTimerState {
  activeDurationMs: number;
}

/**
 * Local render-loop for an in-progress activity. Ticks every second while
 * status === 'active'; freezes while 'paused'. Pause time is excluded from
 * the displayed active duration, matching the "distance/duration must not
 * grow during a break" requirement.
 */
export function useActivityTimer(activity: Activity | null): ActivityTimerState {
  const [activeDurationMs, setActiveDurationMs] = useState(0);
  const pauseStartRef = useRef<number | null>(null);
  const accumulatedPauseRef = useRef(0);

  useEffect(() => {
    if (!activity) {
      setActiveDurationMs(0);
      accumulatedPauseRef.current = 0;
      pauseStartRef.current = null;
      return;
    }

    const start = new Date(activity.startTimestamp).getTime();

    if (activity.status === 'paused') {
      if (pauseStartRef.current === null) pauseStartRef.current = Date.now();
      setActiveDurationMs(Date.now() - start - accumulatedPauseRef.current - (Date.now() - pauseStartRef.current));
      return;
    }

    if (pauseStartRef.current !== null) {
      accumulatedPauseRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }

    const tick = () => setActiveDurationMs(Math.max(0, Date.now() - start - accumulatedPauseRef.current));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activity]);

  return { activeDurationMs };
}
