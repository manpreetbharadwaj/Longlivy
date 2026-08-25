import { useEffect, useState } from 'react';
import { useSharedValue, useAnimatedReaction, withDelay, withTiming, runOnJS, Easing } from 'react-native-reanimated';

interface UseAnimatedProgressOptions {
  /** Extra delay in ms before the animation starts — pass `index * motion.staggerStepMs` to sync with a card's entrance. */
  delay?: number;
  /**
   * Minimum change in the animated value before it's pushed back to React
   * state. Screens with many concurrent progress rings/counters (e.g. the
   * Home dashboard) would otherwise trigger a `runOnJS` cross-thread call on
   * every single frame, per instance. Defaults to 0 (unquantized, matches
   * prior behavior) — set e.g. `0.002` for a 0..1 fraction or `0.5` for a
   * larger-range value. The final target value is always emitted exactly,
   * regardless of step.
   */
  step?: number;
}

/**
 * Bridges a Reanimated-smoothed value back into plain React state, for
 * components that take a plain numeric prop (AppProgressRing, AppProgressBar)
 * rather than an animatedProps-aware one. Animates from 0 to `target` once
 * on mount and whenever `target` changes — used to make dashboard progress
 * indicators fill in rather than snap straight to their value.
 */
export function useAnimatedProgress(target: number, duration = 900, options?: UseAnimatedProgressOptions): number {
  const { delay = 0, step = 0 } = options ?? {};
  const [value, setValue] = useState(0);
  const sharedValue = useSharedValue(0);
  const lastEmitted = useSharedValue(0);

  useEffect(() => {
    const animation = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
    sharedValue.value = delay > 0 ? withDelay(delay, animation) : animation;
  }, [target, duration, delay, sharedValue]);

  useAnimatedReaction(
    () => sharedValue.value,
    (current) => {
      const isFinal = current === target;
      if (step > 0 && !isFinal && Math.abs(current - lastEmitted.value) < step) return;
      lastEmitted.value = current;
      runOnJS(setValue)(current);
    }
  );

  return value;
}
