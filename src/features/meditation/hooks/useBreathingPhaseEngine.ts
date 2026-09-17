import { useCallback, useEffect, useRef, useState } from 'react';
import { BreathingScheme } from '../models';

export type BreathingPhase = 'preparing' | 'inhale' | 'hold' | 'exhale' | 'secondHold' | 'completed';

interface PhaseStep {
  phase: 'inhale' | 'hold' | 'exhale' | 'secondHold';
  seconds: number;
}

export interface BreathingPhaseEngine {
  phase: BreathingPhase;
  /** Duration of the CURRENT phase in seconds (0 once completed). */
  phaseDurationSeconds: number;
  /** 0..1 progress through the current phase. */
  phaseProgress: number;
  /** 0-based index of the repetition currently in progress. */
  repetitionIndex: number;
  totalRepetitions: number;
  isRunning: boolean;
  start: () => void;
  /** Early exit — distinct from the engine reaching 'completed' on its own (Section 13/14). */
  stop: () => void;
}

// A brief settling beat before the first inhale — not a countdown, and
// nothing like Activity's 15s spoken countdown (Section 12): short enough
// that breathing still feels immediate.
const PREPARING_SECONDS = 1.5;
const TICK_MS = 100;

/**
 * The single authoritative source for breathing phase and timing (Section 3).
 * Visuals and audio cues must derive their state from this engine's output —
 * never run their own setTimeout chain or an animation duration that could
 * drift from it. A self-correcting interval (comparing wall-clock elapsed
 * time each tick, the same pattern already used by useActivityCountdown)
 * rather than chained setTimeouts, so phase timing can't drift across a long
 * session the way a `.start(() => next())` Animated chain can.
 *
 * `repetitions` is now actually enforced — previously the animation looped
 * forever regardless of the scheme's repetition count, and the screen had no
 * way to tell a natural completion from the user tapping "Finish" early.
 */
export function useBreathingPhaseEngine(scheme: BreathingScheme | undefined): BreathingPhaseEngine {
  const [phase, setPhase] = useState<BreathingPhase>('preparing');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [repetitionIndex, setRepetitionIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseStartRef = useRef(0);
  const stepIndexRef = useRef(0);
  const phaseRef = useRef<BreathingPhase>('preparing');
  const repetitionRef = useRef(0);

  const steps: PhaseStep[] = scheme
    ? (
        [
          { phase: 'inhale', seconds: scheme.inhaleSeconds },
          { phase: 'hold', seconds: scheme.holdSeconds },
          { phase: 'exhale', seconds: scheme.exhaleSeconds },
          { phase: 'secondHold', seconds: scheme.secondHoldSeconds },
        ] as PhaseStep[]
      ).filter((step) => step.seconds > 0)
    : [];
  const totalRepetitions = scheme?.repetitions ?? 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const currentPhaseDuration = phase === 'preparing' ? PREPARING_SECONDS : phase === 'completed' ? 0 : steps[stepIndexRef.current]?.seconds ?? 0;

  const goToStep = useCallback((stepIndex: number) => {
    stepIndexRef.current = stepIndex;
    const nextPhase = steps[stepIndex]?.phase ?? 'completed';
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    phaseStartRef.current = Date.now();
    setPhaseProgress(0);
  }, [steps]);

  const advance = useCallback(() => {
    if (phaseRef.current === 'preparing') {
      if (steps.length === 0) {
        clearTimer();
        setIsRunning(false);
        phaseRef.current = 'completed';
        setPhase('completed');
        return;
      }
      goToStep(0);
      return;
    }
    const nextStepIndex = stepIndexRef.current + 1;
    if (nextStepIndex < steps.length) {
      goToStep(nextStepIndex);
      return;
    }
    // Finished every step in this repetition.
    const nextRep = repetitionRef.current + 1;
    if (nextRep >= totalRepetitions) {
      clearTimer();
      setIsRunning(false);
      phaseRef.current = 'completed';
      setPhase('completed');
      setPhaseProgress(1);
      return;
    }
    repetitionRef.current = nextRep;
    setRepetitionIndex(nextRep);
    goToStep(0);
  }, [steps, totalRepetitions, clearTimer, goToStep]);

  const tick = useCallback(() => {
    const durationMs = currentPhaseDuration * 1000;
    if (durationMs <= 0) {
      advance();
      return;
    }
    const elapsed = Date.now() - phaseStartRef.current;
    if (elapsed >= durationMs) {
      advance();
    } else {
      setPhaseProgress(Math.min(1, elapsed / durationMs));
    }
  }, [currentPhaseDuration, advance]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(tick, TICK_MS);
    return clearTimer;
  }, [isRunning, tick, clearTimer]);

  const start = useCallback(() => {
    if (!scheme || steps.length === 0) return;
    stepIndexRef.current = 0;
    repetitionRef.current = 0;
    phaseRef.current = 'preparing';
    setRepetitionIndex(0);
    setPhase('preparing');
    setPhaseProgress(0);
    phaseStartRef.current = Date.now();
    setIsRunning(true);
  }, [scheme, steps.length]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { phase, phaseDurationSeconds: currentPhaseDuration, phaseProgress, repetitionIndex, totalRepetitions, isRunning, start, stop };
}
