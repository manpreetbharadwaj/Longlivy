import React, { useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveFast } from '@/features/fasting/selectors';
import { motion } from '@/theme/motion';
import { FastingHeroLayout } from './FastingHeroLayout';

const AUTO_ADVANCE_MS = 1900;

/**
 * The confirming "moment" between choosing a method and landing in the
 * timeline — per the design brief: "Starting a fast should feel like the
 * beginning of a personal process, not like activating a simple timer."
 * Auto-advances into ActiveFast after a beat, but is also tappable so it
 * never blocks someone who wants to move on immediately.
 */
export const FastingStartedScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const { theme } = useTheme();
  const activeFast = useAppSelector(selectActiveFast);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const advanced = useRef(false);

  const goToTimeline = () => {
    if (advanced.current) return;
    advanced.current = true;
    navigation.replace('ActiveFast');
  };

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.duration.fast });
    scale.value = withDelay(
      100,
      withSequence(withTiming(1.15, { duration: 360, easing: motion.easing.decelerate }), withTiming(1, { duration: 220, easing: motion.easing.standard }))
    );
    const timer = setTimeout(goToTimeline, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  const methodLabel = activeFast?.method === 'individual' ? 'Individual fast' : activeFast?.method;
  const plannedEnd = activeFast ? new Date(activeFast.plannedEndTimestamp) : null;

  return (
    <Pressable style={{ flex: 1 }} onPress={goToTimeline} accessibilityRole="button" accessibilityLabel="Continue to your fasting timeline">
      <FastingHeroLayout scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 148, height: 148, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg }}>
            <GlowOrb size={148} color="#0E7A9E" opacity={0.45} pulse />
            <Animated.View
              style={[
                {
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: 'rgba(31,163,145,0.22)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31,163,145,0.6)',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                markStyle,
              ]}
            >
              <AppIcon name="flame" size={44} color="#FFFFFF" />
            </Animated.View>
          </View>

          <FadeSlideIn delay={motion.duration.base}>
            <AppText variant="displayMedium" color="#FFFFFF" align="center">
              Fasting started
            </AppText>
          </FadeSlideIn>
          {methodLabel ? (
            <FadeSlideIn delay={motion.duration.base + motion.staggerStepMs * 2}>
              <AppText variant="bodyLarge" color="rgba(255,255,255,0.7)" align="center" style={{ marginTop: theme.spacing.xs }}>
                {methodLabel}
                {plannedEnd ? ` · planned end ${plannedEnd.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}
              </AppText>
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={motion.duration.base + motion.staggerStepMs * 5}>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.4)" align="center" style={{ marginTop: theme.spacing.xl }}>
              Tap anywhere to continue
            </AppText>
          </FadeSlideIn>
        </View>
      </FastingHeroLayout>
    </Pressable>
  );
};
