import React, { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { AppText } from '@/components/common/AppText';
import { onboardingGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

/**
 * Fully static — no network/API dependency. Fades in the wordmark then
 * hands off to whichever route RootNavigator decides on (onboarding, auth,
 * or main app) once auth/session bootstrap resolves.
 *
 * Uses the same dark atmosphere as onboarding/the main app (rather than a
 * flat theme.colors.primary fill) so the very
 * first frame the user sees already reads as "this app", not a plain
 * brand-color splash screen.
 */
export const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <View style={{ flex: 1, backgroundColor: onboardingGradient[0], alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={onboardingGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            marginBottom: theme.spacing.md,
          }}
        >
          <Image source={require('../../assets/images/logo-mark-gold.png')} style={{ width: '68%', height: '68%' }} resizeMode="contain" />
        </View>
        <AppText variant="displayMedium" color={onboardingGlass.textPrimary}>
          Longlivy
        </AppText>
        <AppText variant="bodyMedium" color={onboardingGlass.textSecondary} style={{ marginTop: 4 }}>
          {t('splash.tagline')}
        </AppText>
      </Animated.View>
    </View>
  );
};
