import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';

const GRADIENT = ['#6AA3DE', '#1F4E7A'] as const;

/**
 * The Activity screen's primary CTA — a full card treatment (icon tile +
 * title + subtitle + chevron) rather than AppGradientButton's plain
 * centered-label style, so it reads as "the main action of the screen"
 * the way a single-line button couldn't. Same gradient AppGradientButton
 * already used here, just given more visual weight.
 */
export const StartActivityCTA: React.FC<{ onPress: () => void }> = React.memo(({ onPress }) => {
  const { theme } = useTheme();
  const pressScale = useSharedValue(1);
  const iconPulse = useSharedValue(0);

  useEffect(() => {
    iconPulse.value = withDelay(
      700,
      withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })), -1, true)
    );
  }, [iconPulse]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + iconPulse.value * 0.12 }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.97, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel="Start activity"
    >
      <Animated.View style={pressStyle}>
        <LinearGradient
          colors={GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: theme.radius.xl, padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center' }}
        >
          <Animated.View
            style={[
              { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
              iconStyle,
            ]}
          >
            <AppIcon name="walk" size={26} color="#FFFFFF" />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <AppText variant="headingMedium" color="#FFFFFF">
              Start Activity
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={{ marginTop: 2 }}>
              Track a new workout
            </AppText>
          </View>
          <AppIcon name="chevron-forward" size={22} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});
StartActivityCTA.displayName = 'StartActivityCTA';
