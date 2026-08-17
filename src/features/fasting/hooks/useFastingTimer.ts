import { useEffect, useState } from 'react';
import { FastingSession } from '../models';
import { calculateFastingProgress, FastingProgress } from '../services/FastingCalculator';

/**
 * Local, component-scoped render loop for the live fasting countdown.
 * Recomputes progress from timestamps every second — this value never
 * touches Redux, per the "no server/global-state updates every second" rule.
 */
export function useFastingTimer(session: FastingSession | null): FastingProgress | null {
  const [progress, setProgress] = useState<FastingProgress | null>(() =>
    session ? calculateFastingProgress(session.startTimestamp, session.plannedEndTimestamp) : null
  );

  useEffect(() => {
    if (!session) {
      setProgress(null);
      return;
    }
    setProgress(calculateFastingProgress(session.startTimestamp, session.plannedEndTimestamp));
    const interval = setInterval(() => {
      setProgress(calculateFastingProgress(session.startTimestamp, session.plannedEndTimestamp));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return progress;
}
