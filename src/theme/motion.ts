import { Easing } from 'react-native-reanimated';

/**
 * Shared animation timing so entrance/emphasis motion feels consistent
 * across the app instead of every screen picking its own numbers.
 *
 * Motion patterns — prefer these over hand-rolled Reanimated calls:
 * - Mount-in fade/slide for a single element: `FadeSlideIn` (components/common).
 * - A list/group of cards entering in sequence: `StaggerGroup` (components/common),
 *   or `useStaggerEntrance` (hooks) when the element needs its own Animated.View
 *   for other transforms (idle motion, press-scale) alongside the entrance.
 * - A number counting up on mount: `AnimatedNumberText` (components/common).
 * - A progress ring/bar filling in: `useAnimatedProgress` (hooks).
 */
export const motion = {
  duration: {
    fast: 180,
    base: 320,
    slow: 600,
    ambient: 2200,
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    decelerate: Easing.out(Easing.cubic),
    accelerate: Easing.in(Easing.cubic),
  },
  /** Per-item delay step for staggered list/card reveals (item index * this). */
  staggerStepMs: 70,
} as const;
