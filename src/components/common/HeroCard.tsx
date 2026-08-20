import React from 'react';
import { Pressable, View, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';

interface HeroCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Adds a subtle press-scale (in addition to the existing opacity dip) — opt-in so existing call sites keep their current feel unchanged. */
  scaleOnPress?: boolean;
}

/**
 * The AppCard equivalent for dark hero surfaces — same API (children,
 * onPress, style) so existing AppCard usages can switch over directly.
 * AppCard itself is untouched; this is a parallel component, not a
 * replacement, since most of the app still renders on the light theme.
 */
export const HeroCard: React.FC<HeroCardProps> = React.memo(({ children, onPress, style, accessibilityLabel, scaleOnPress = false }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animatedScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cardStyle: ViewStyle = {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  };

  if (onPress) {
    if (scaleOnPress) {
      return (
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withTiming(0.97, { duration: motion.duration.fast });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: motion.duration.fast });
          }}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Animated.View style={[cardStyle, style, animatedScaleStyle]}>{children}</Animated.View>
        </Pressable>
      );
    }
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [cardStyle, style, pressed ? { opacity: 0.85 } : null]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
});

HeroCard.displayName = 'HeroCard';
