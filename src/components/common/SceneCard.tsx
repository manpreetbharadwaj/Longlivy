import React from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

interface SceneCardProps {
  /** The artwork - anything that fills its parent (the SVG scenes do). */
  art: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  height?: number;
  width?: number;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** A scenic card: the artwork fills the tile, a soft scrim keeps the title legible. Used for Meditation collections/sounds/practices and Activity choices so they read as one family. */
export const SceneCard: React.FC<SceneCardProps> = React.memo(
  ({ art, title, subtitle, onPress, height = 132, width, selected = false, disabled = false, style, accessibilityLabel }) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: motion.duration.fast });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.duration.fast });
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
        accessibilityState={{ selected, disabled }}
        style={[width != null ? { width } : { flex: 1 }, style]}
      >
        <Animated.View
          style={[
            {
              height,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? dashboardColors.accentBright : dashboardColors.border,
              backgroundColor: dashboardColors.surface,
              opacity: disabled ? 0.5 : 1,
            },
            animatedStyle,
          ]}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {art}
          </View>
          <LinearGradient
            colors={['rgba(6,8,10,0)', 'rgba(6,8,10,0.78)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }}
            pointerEvents="none"
          />
          {selected ? (
            <View
              style={{
                position: 'absolute',
                top: theme.spacing.xs,
                right: theme.spacing.xs,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: dashboardColors.accentBright,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="checkmark" size={14} color={dashboardColors.background} />
            </View>
          ) : null}
          <View style={{ flex: 1, justifyContent: 'flex-end', padding: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" numberOfLines={2}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" color="rgba(255,255,255,0.72)" numberOfLines={1} style={{ marginTop: 1 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    );
  }
);
SceneCard.displayName = 'SceneCard';
