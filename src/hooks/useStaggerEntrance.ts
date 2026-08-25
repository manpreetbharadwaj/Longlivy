import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { motion } from '@/theme/motion';

interface UseStaggerEntranceOptions {
  step?: number;
  initialDelay?: number;
  fromY?: number;
  disabled?: boolean;
}

/**
 * Same fade+slide-up entrance timing as `FadeSlideIn`/`StaggerGroup`, as an
 * animated style instead of a wrapping component — for grid tiles or
 * `renderItem` cases that already need their own `Animated.View` (and may
 * combine this with other transforms, e.g. idle motion or press-scale)
 * rather than an extra wrapper.
 */
export function useStaggerEntrance(index: number, options?: UseStaggerEntranceOptions) {
  const { step = motion.staggerStepMs, initialDelay = 0, fromY = 16, disabled = false } = options ?? {};
  const progress = useSharedValue(disabled ? 1 : 0);

  useEffect(() => {
    if (disabled) return;
    progress.value = withDelay(initialDelay + index * step, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
  }, [disabled, index, initialDelay, step, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * fromY }],
  }));
}
