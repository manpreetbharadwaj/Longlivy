import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { AppIcon } from '@/components/common/AppIcon';

interface MeditationBreathingVisualProps {
  /** Runs the breathing cycle while true; freezes at rest otherwise (paused/idle). */
  active: boolean;
  size?: number;
  color?: string;
}

// A gentle, continuous inhale → hold → exhale → hold cycle — ambient, not
// tied to any specific breathing scheme (that's BreathingExerciseScreen's
// job); this just gives the session's central figure a sense of life.
const INHALE_MS = 4000;
const HOLD_MS = 1500;
const EXHALE_MS = 4000;

/** The seated-figure mark at the center of an active meditation session, breathing slowly while the session plays. */
export const MeditationBreathingVisual: React.FC<MeditationBreathingVisualProps> = React.memo(({ active, size = 44, color = '#FFFFFF' }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: INHALE_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: HOLD_MS }),
          withTiming(0, { duration: EXHALE_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: HOLD_MS })
        ),
        -1,
        false
      );
    } else {
      progress.value = withTiming(0, { duration: 600 });
    }
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.92 + progress.value * 0.16 }] }));

  return (
    <Animated.View style={style}>
      <AppIcon name="meditation" family="material-community" size={size} color={color} />
    </Animated.View>
  );
});
MeditationBreathingVisual.displayName = 'MeditationBreathingVisual';
