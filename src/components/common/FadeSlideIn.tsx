import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { motion } from '@/theme/motion';

interface FadeSlideInProps {
  children: React.ReactNode;
  /** Extra delay in ms before this item starts animating — pass `index * motion.staggerStepMs` for staggered lists. */
  delay?: number;
  /** Starting vertical offset in px; animates to 0. */
  fromY?: number;
  style?: ViewStyle;
}

/**
 * Standard mount-in animation (fade + slide up) used across onboarding and
 * "moment" screens so entrances feel consistent instead of every screen
 * hand-rolling its own Reanimated calls. Runs once on mount.
 */
export const FadeSlideIn: React.FC<FadeSlideInProps> = ({ children, delay = 0, fromY = 16, style }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * fromY }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};
