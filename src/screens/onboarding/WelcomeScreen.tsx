import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingData, onboardingCtaGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

/** A floating "live signal" chip — the value prop shown as ambient data rather than explained in a sentence. Drifts very slightly to feel alive, not pinned. */
const SignalChip: React.FC<{
  label: string;
  color: string;
  delay: number;
  style: { top?: number; bottom?: number; left?: number; right?: number };
}> = ({ label, color, delay, style }) => {
  const opacity = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
    drift.value = withDelay(
      delay + motion.duration.slow,
      withRepeat(withSequence(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })), -1, false)
    );
  }, [delay, opacity, drift]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: -drift.value * 6 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
        },
        style,
        animatedStyle,
      ]}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginRight: 7 }} />
      <AppText variant="caption" color="rgba(255,255,255,0.75)">
        {label}
      </AppText>
    </Animated.View>
  );
};

/** Concentric scanning rings around the wordmark — a slow breathing ring (indigo, echoes calm/vitality) plus a thin rotating cyan ring (echoes "live signal"/biohacking read) so the mark feels instrumented, not decorative. */
const SignalMark: React.FC = () => {
  const breathe = useSharedValue(1);
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.85);
  const rotate = useSharedValue(0);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    markScale.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    breathe.value = withDelay(
      motion.duration.slow,
      withRepeat(withSequence(withTiming(1.16, { duration: 1900, easing: Easing.out(Easing.sin) }), withTiming(1, { duration: 1900, easing: Easing.in(Easing.sin) })), -1, false)
    );
    rotate.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [breathe, markOpacity, markScale, rotate]);

  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value, transform: [{ scale: markScale.value }] }));
  const breatheStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value * 0.45, transform: [{ scale: breathe.value }] }));
  const rotateStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value * 0.7, transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: onboardingAccent }, breatheStyle]} />
      <Animated.View
        style={[
          { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1.5, borderTopColor: onboardingData, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
          rotateStyle,
        ]}
      />
      <Animated.View style={[{ width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, markStyle]}>
        <LinearGradient colors={onboardingCtaGradient} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="displayMedium" color="#FFFFFF" weight="800">
            L
          </AppText>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
          <SignalChip label="14:32 fasted" color={onboardingAccent} delay={motion.duration.slow + motion.staggerStepMs * 4} style={{ top: 110, left: 8 }} />
          <SignalChip label="1,840 kcal today" color={onboardingData} delay={motion.duration.slow + motion.staggerStepMs * 6} style={{ top: 190, right: 4 }} />
          <SignalChip label="Resting 58 bpm" color={onboardingAccent} delay={motion.duration.slow + motion.staggerStepMs * 8} style={{ bottom: 160, left: 20 }} />

          <View style={{ marginBottom: theme.spacing.xl }}>
            <SignalMark />
          </View>

          <FadeSlideIn delay={motion.duration.slow}>
            <AppText variant="caption" color={onboardingData} align="center" style={{ letterSpacing: 3, marginBottom: theme.spacing.xs }}>
              LONGLIVY
            </AppText>
          </FadeSlideIn>
          <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 2}>
            <AppText variant="displayLarge" color={onboardingGlass.textPrimary} align="center" style={{ maxWidth: 340 }}>
              Your longevity, engineered.
            </AppText>
          </FadeSlideIn>
          <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 4}>
            <AppText variant="bodyLarge" color={onboardingGlass.textSecondary} align="center" style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}>
              Fasting, nutrition, activity and mind — read as one connected system, not four separate apps.
            </AppText>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 10} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label="Begin" onPress={() => navigation.navigate('Value')} colors={onboardingCtaGradient} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
