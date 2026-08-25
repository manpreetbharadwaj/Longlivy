import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, interpolate, Easing } from 'react-native-reanimated';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { ctaGradient } from '@/theme/gradients';

interface CenterActionButtonProps {
  size: number;
  icon: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
  /** Whether this button's destination (Home) is the currently focused tab — dials the idle halo down to a quieter "you're already here" state. */
  active?: boolean;
}

// Deliberately not a clean multiple of the button's 1800ms float cycle, so
// the halo's expand-and-fade never falls into a repeating lock-step with
// the float — the two motions should read as two independent, ambient
// rhythms rather than one bigger pulse.
const HALO_DURATION = 2600;
const HALO_PEAK_OPACITY_IDLE = 0.4;
const HALO_PEAK_OPACITY_ACTIVE = 0.18;

/**
 * The raised primary action at the center of the floating tab bar — brand
 * teal gradient (the same ctaGradient used on hero CTAs elsewhere), a
 * light top-edge border for a soft highlight rather than a glossy shine,
 * and the app's own `shadows.floating` token for depth (native elevation
 * on Android, not a blur) so it stays cheap to render. Press-scale and a
 * slow float are the button's own motion; a separate breathing halo behind
 * it (opacity/scale only — animated `shadowOpacity` isn't reliably
 * animatable on Android) gives it an "attract" presence at rest, without
 * inflating its touch target.
 */
export const CenterActionButton: React.FC<CenterActionButtonProps> = React.memo(({ size, icon, onPress, accessibilityLabel, active = false }) => {
  const { theme } = useTheme();
  const pressScale = useSharedValue(1);
  const float = useSharedValue(0);
  const haloProgress = useSharedValue(0);

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

  useEffect(() => {
    haloProgress.value = withRepeat(withTiming(1, { duration: HALO_DURATION, easing: Easing.out(Easing.cubic) }), -1, false);
  }, [haloProgress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }, { translateY: -float.value * 2 }],
  }));

  const haloStyle = useAnimatedStyle(() => {
    const peakOpacity = active ? HALO_PEAK_OPACITY_ACTIVE : HALO_PEAK_OPACITY_IDLE;
    return {
      opacity: interpolate(haloProgress.value, [0, 1], [peakOpacity, 0]),
      transform: [{ scale: interpolate(haloProgress.value, [0, 1], [1, 1.3]) }],
    };
  }, [active]);

  const haloSize = size * 1.3;

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
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: ctaGradient[0],
            top: -(haloSize - size) / 2,
            left: -(haloSize - size) / 2,
          },
          haloStyle,
        ]}
      />
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
