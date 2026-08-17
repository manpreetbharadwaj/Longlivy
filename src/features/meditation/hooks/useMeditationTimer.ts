import { useEffect, useRef, useState } from 'react';

interface MeditationTimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * Local render-loop timer for an in-progress meditation session. Tracks
 * elapsed active seconds client-side; the *authoritative* active time is
 * still derived server/repository-side from the session's event log
 * (see MeditationSessionCalculator) once the session completes.
 */
export function useMeditationTimer(): MeditationTimerState {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return {
    elapsedSeconds,
    isRunning,
    start: () => {
      setElapsedSeconds(0);
      setIsRunning(true);
    },
    pause: () => setIsRunning(false),
    resume: () => setIsRunning(true),
    reset: () => {
      setElapsedSeconds(0);
      setIsRunning(false);
    },
  };
}
