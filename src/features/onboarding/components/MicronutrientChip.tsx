import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { onboardingGlass } from '../theme/onboardingTheme';

interface MicronutrientChipProps {
  label: string;
  blurb: string;
  selected: boolean;
  accentColor: string;
  onPress: () => void;
}

/**
 * A single selectable nutrient — compact glass chip (label + one-line why)
 * with a checkmark that fades in on selection, colored per category so the
 * grouped rows on MicronutrientSetupScreen stay visually distinct without
 * needing section dividers. Toggling is instant and reversible — there's no
 * "confirm" step, so exploring costs nothing.
 */
export const MicronutrientChip: React.FC<MicronutrientChipProps> = React.memo(({ label, blurb, selected, accentColor, onPress }) => {
  const { theme } = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.standard });
    if (selected) {
      scale.value = withSequence(withTiming(1.03, { duration: 120, easing: motion.easing.decelerate }), withTiming(1, { duration: 160, easing: motion.easing.standard }));
    }
  }, [selected, progress, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [onboardingGlass.border, accentColor]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [onboardingGlass.fill, `${accentColor}22`]),
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ width: '48%', marginBottom: theme.spacing.sm }}>
      {({ pressed }) => (
        <Animated.View
          style={[
            { borderRadius: theme.radius.lg, borderWidth: 1.5, padding: theme.spacing.sm, opacity: pressed ? 0.88 : 1 },
            cardStyle,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <AppText variant="bodyMedium" color={onboardingGlass.textPrimary}>
              {label}
            </AppText>
            <Animated.View style={dotStyle}>
              <AppIcon name="checkmark-circle" size={16} color={accentColor} />
            </Animated.View>
          </View>
          <AppText variant="caption" color={onboardingGlass.textTertiary}>
            {blurb}
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
});

MicronutrientChip.displayName = 'MicronutrientChip';
