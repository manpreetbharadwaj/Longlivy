import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { ctaGradient } from '@/theme/gradients';

interface CenterActionButtonProps {
  size: number;
  icon: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * The raised primary action at the center of the floating tab bar — brand
 * teal gradient (the same ctaGradient used on hero CTAs elsewhere), a
 * light top-edge border for a soft highlight rather than a glossy shine,
 * and the app's own `shadows.floating` token for depth (native elevation
 * on Android, not a blur) so it stays cheap to render. A slow, very small
 * float and a press-scale are the only two animations — deliberately not
 * a constant attention-grabbing pulse.
 */
export const CenterActionButton: React.FC<CenterActionButtonProps> = React.memo(({ size, icon, onPress, accessibilityLabel }) => {
  const { theme } = useTheme();
  const pressScale = useSharedValue(1);
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { translateY: -float.value * 2 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.9, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2 }, theme.shadows.floating, style]}>
        <LinearGradient
          colors={ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.28)',
          }}
        >
          <AppIcon name={icon} size={size * 0.42} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});
CenterActionButton.displayName = 'CenterActionButton';
