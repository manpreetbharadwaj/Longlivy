import { useEffect, useState } from 'react';
import { useSharedValue, useAnimatedReaction, withTiming, runOnJS, Easing } from 'react-native-reanimated';

/**
 * Bridges a Reanimated-smoothed value back into plain React state, for
 * components that take a plain numeric prop (AppProgressRing, AppProgressBar)
 * rather than an animatedProps-aware one. Animates from 0 to `target` once
 * on mount and whenever `target` changes — used to make dashboard progress
 * indicators fill in rather than snap straight to their value.
 */
export function useAnimatedProgress(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const sharedValue = useSharedValue(0);

  useEffect(() => {
    sharedValue.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
  }, [target, duration, sharedValue]);

  useAnimatedReaction(
    () => sharedValue.value,
    (current) => {
      runOnJS(setValue)(current);
    }
  );

  return value;
}
