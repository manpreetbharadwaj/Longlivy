import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { onboardingGlass } from '../theme/onboardingTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Illustrative trend shapes — a visual cue for "the outcome this goal points toward", not a data chart. */
const SPARK_PATHS: Record<string, string> = {
  weight_loss: 'M2 6 C 16 8, 24 14, 34 16 S 52 24, 62 26',
  maintenance: 'M2 16 C 14 10, 22 22, 34 16 S 50 10, 62 16',
  muscle_gain: 'M2 26 C 16 22, 24 18, 34 12 S 52 6, 62 4',
};
const SPARK_LENGTH = 90;

const Sparkline: React.FC<{ goalKey: string; color: string; delay: number }> = ({ goalKey, color, delay }) => {
  const draw = useSharedValue(0);
  useEffect(() => {
    draw.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
  }, [draw, delay]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: (1 - draw.value) * SPARK_LENGTH }));
  return (
    <Svg width={64} height={28} viewBox="0 0 64 28">
      <AnimatedPath d={SPARK_PATHS[goalKey]} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray={SPARK_LENGTH} animatedProps={animatedProps} />
    </Svg>
  );
};

interface GoalCardProps {
  goalKey: 'weight_loss' | 'maintenance' | 'muscle_gain';
  icon: AppIconName;
  title: string;
  outcome: string;
  gradient: readonly [string, string, ...string[]];
  accent: string;
  selected: boolean;
  index: number;
  onPress: () => void;
}

/** Full-width, visually rich goal card — icon tile, outcome copy and an animated trend sparkline (down/flat/up) so the choice reads as an outcome, not just a label. */
export const GoalCard: React.FC<GoalCardProps> = React.memo(({ goalKey, icon, title, outcome, gradient, accent, selected, index, onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(withTiming(1.02, { duration: 140, easing: motion.easing.decelerate }), withTiming(1, { duration: 180, easing: motion.easing.standard }));
    }
  }, [selected, scale]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} style={{ marginBottom: theme.spacing.sm }}>
      {({ pressed }) => (
        <Animated.View
          style={[
            {
              borderRadius: theme.radius.xl,
              borderWidth: 1.5,
              borderColor: selected ? accent : onboardingGlass.border,
              backgroundColor: selected ? 'rgba(255,255,255,0.07)' : onboardingGlass.fill,
              opacity: pressed ? 0.9 : 1,
              overflow: 'hidden',
            },
            cardStyle,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md }}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 48, height: 48, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}
            >
              <AppIcon name={icon} size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSmall" color={onboardingGlass.textPrimary}>
                {title}
              </AppText>
              <AppText variant="bodySmall" color={onboardingGlass.textSecondary} style={{ marginTop: 2 }}>
                {outcome}
              </AppText>
            </View>
            <Sparkline goalKey={goalKey} color={accent} delay={motion.staggerStepMs * index} />
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
});

GoalCard.displayName = 'GoalCard';
