import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { onboardingAccent, onboardingGlass } from '../theme/onboardingTheme';

interface OnboardingProgressIndicatorProps {
  step: number;
  totalSteps: number;
}

/**
 * Replaces the old flat segmented bar with a single thin track and a
 * smoothly-morphing glow fill — reads as "you're most of the way there"
 * rather than "6 boxes to check off". Paired with a plain "Step X of N"
 * label so the user always knows exactly where they are, without the
 * visual weight of individually-outlined segments.
 */
export const OnboardingProgressIndicator: React.FC<OnboardingProgressIndicatorProps> = ({ step, totalSteps }) => {
  const { theme } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(step / totalSteps, { duration: motion.duration.slow, easing: motion.easing.decelerate });
  }, [step, totalSteps, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={{ marginBottom: theme.spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
        <AppText variant="caption" color={onboardingGlass.textTertiary} style={{ letterSpacing: 1 }}>
          STEP {step} OF {totalSteps}
        </AppText>
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 2, backgroundColor: onboardingAccent }, fillStyle]} />
      </View>
    </View>
  );
};
