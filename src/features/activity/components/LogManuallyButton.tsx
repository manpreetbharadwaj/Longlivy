import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';

/**
 * The manual-log secondary action — a deliberate icon-tile + title/subtitle
 * row (matching StartActivityCTA's structure at secondary-action weight)
 * instead of a plain centered-label card. The pencil icon rotates and
 * scales slightly on press, on top of the card's own compress, so the tap
 * reads as "editing/adding an entry" rather than a generic button press.
 */
export const LogManuallyButton: React.FC<{ onPress: () => void }> = React.memo(({ onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${iconRotate.value}deg` }, { scale: 1 + Math.abs(iconRotate.value) / 450 }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: motion.duration.fast });
        iconRotate.value = withTiming(-90, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: motion.duration.fast });
        iconRotate.value = withTiming(0, { duration: motion.duration.base });
      }}
      accessibilityRole="button"
      accessibilityLabel="Log activity manually"
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.14)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
          },
          containerStyle,
        ]}
      >
        <Animated.View
          style={[
            { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm },
            iconStyle,
          ]}
        >
          <AppIcon name="create-outline" size={19} color="#6AA3DE" />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSmall" color="#FFFFFF">
            Log Activity Manually
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
            Add a past workout by hand
          </AppText>
        </View>
        <AppIcon name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
      </Animated.View>
    </Pressable>
  );
});
LogManuallyButton.displayName = 'LogManuallyButton';
