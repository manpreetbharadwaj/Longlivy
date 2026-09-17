import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { AppText } from './AppText';

interface HeroChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Selected-state accent (tinted background + border) — defaults to the app's teal accent so existing call sites (onboarding, etc.) keep their current look unless they opt into their own section color. */
  activeColor?: string;
}

/** Pill selector for the dark hero screens — the AppChip equivalent for compact multi-option rows (e.g. gender, meditation categories). The selected state cross-fades smoothly instead of snapping. */
export const HeroChip: React.FC<HeroChipProps> = React.memo(({ label, selected, onPress, activeColor = '#3D5266' }) => {
  const { theme } = useTheme();
  const selectedProgress = useSharedValue(selected ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.standard });
  }, [selected, selectedProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(selectedProgress.value, [0, 1], ['rgba(255,255,255,0.08)', activeColor + '2E']),
    borderColor: interpolateColor(selectedProgress.value, [0, 1], ['rgba(255,255,255,0.16)', activeColor]),
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.94, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs + 2,
            borderRadius: theme.radius.pill,
            borderWidth: 1.5,
            marginRight: theme.spacing.xs,
          },
          animatedStyle,
        ]}
      >
        <AppText variant="label" color="#FFFFFF">
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
});

HeroChip.displayName = 'HeroChip';
