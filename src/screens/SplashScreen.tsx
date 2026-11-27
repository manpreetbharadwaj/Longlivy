import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { AppText } from '@/components/common/AppText';
import { GlowOrb } from '@/components/common/GlowOrb';
import { onboardingGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { accentGlow } from '@/theme/gradients';
import { motion } from '@/theme/motion';

const LOGO_SIZE = 128;
const GLOW_SIZE = 220;
const BAR_WIDTH = 160;
const BAR_HEIGHT = 4;
const RUNNER_WIDTH = 72;

/**
 * Fully static — no network/API dependency. Fades in the wordmark then
 * hands off to whichever route RootNavigator decides on (onboarding, auth,
 * or main app) once auth/session bootstrap resolves.
 *
 * Uses the same dark atmosphere as onboarding/the main app (rather than a
 * flat theme.colors.primary fill) so the very first frame the user sees
 * already reads as "this app", not a plain brand-color splash screen. The
 * loading bar below the wordmark is deliberately indeterminate rather than a
 * fake percentage: RootNavigator's own readiness gates (session restore,
 * profile/preference hydration) are near-instant local reads in the common
 * case and can only meaningfully stall on the network in one of them (auth
 * revalidation), so a stepped "N of 4 done" bar would either snap to full
 * almost immediately or sit frozen on one step for an unpredictable stretch
 * — neither reads as real progress. The indeterminate sweep instead stays
 * truthfully tied to actual readiness the only way that matters here: it
 * animates for exactly as long as this screen stays mounted, which is
 * exactly as long as RootNavigator's gate holds.
 */
export const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const logoScale = useSharedValue(reducedMotion ? 1 : 0.86);
  const textOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const textY = useSharedValue(reducedMotion ? 0 : 10);
  const runnerX = useSharedValue(-RUNNER_WIDTH);

  useEffect(() => {
    if (reducedMotion) return;
    logoOpacity.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    logoScale.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    textOpacity.value = withDelay(180, withTiming(1, { duration: motion.duration.base, easing: motion.easing.decelerate }));
    textY.value = withDelay(180, withTiming(0, { duration: motion.duration.base, easing: motion.easing.decelerate }));
    // One-directional sweep (not a back-and-forth shimmer) reads as "working" without competing with the logo entrance for attention.
    runnerX.value = withRepeat(withTiming(BAR_WIDTH, { duration: motion.duration.ambient, easing: Easing.linear }), -1, false);
  }, [reducedMotion, logoOpacity, logoScale, textOpacity, textY, runnerX]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const runnerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: runnerX.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: onboardingGradient[0] }}>
      <LinearGradient colors={onboardingGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: GLOW_SIZE, height: GLOW_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl }}>
            {!reducedMotion ? (
              <GlowOrb
                size={GLOW_SIZE}
                color={accentGlow[0]}
                opacity={0.22}
                pulse
                style={{ top: 0, left: 0 }}
              />
            ) : null}
            <Animated.View
              style={[
                {
                  width: LOGO_SIZE,
                  height: LOGO_SIZE,
                  borderRadius: theme.radius.xl,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000000',
                },
                logoStyle,
              ]}
            >
              <Image source={require('../../assets/images/logo-mark-gold.png')} style={{ width: '62%', height: '62%' }} resizeMode="contain" />
            </Animated.View>
          </View>

          <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
            <AppText variant="displayMedium" color={onboardingGlass.textPrimary} align="center">
              Longlivy
            </AppText>
            <AppText variant="bodyMedium" color={onboardingGlass.textSecondary} align="center" style={{ marginTop: 4 }}>
              {t('splash.tagline')}
            </AppText>
          </Animated.View>
        </View>

        <View style={{ position: 'absolute', bottom: theme.spacing.xxxl, width: BAR_WIDTH, height: BAR_HEIGHT, borderRadius: theme.radius.flat, overflow: 'hidden', backgroundColor: onboardingGlass.fill }}>
          {!reducedMotion ? (
            <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: RUNNER_WIDTH }, runnerStyle]}>
              <LinearGradient
                colors={['transparent', accentGlow[0], 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : (
            // No looping motion for reduced-motion users — a static fill still reads as "loading" without implying a repeating animation.
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', backgroundColor: accentGlow[0], opacity: 0.6 }} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};
