import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTranslation } from '@/localization';
import { AppText } from '@/components/common/AppText';
import { AppLogo } from '@/components/common/AppLogo';
import { onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { brand } from '@/config/branding';

/**
 * Fully static — no network/API dependency. Fades in the logo/wordmark
 * then hands off to whichever route RootNavigator decides on (onboarding,
 * auth, or main app) once auth/session bootstrap resolves.
 *
 * Background is solid black (not the app's usual near-black navy gradient)
 * to match `AppLogo`'s cropped mark as closely as possible — see
 * `AppLogo.tsx` for why the source art needs cropping in the first place.
 * The very next screen (LanguageSelectScreen, via OnboardingBackground)
 * sits on `onboardingGradient[0]` (#05080B) instead — close enough to pure
 * black that the handoff doesn't read as a flash, without pulling the rest
 * of onboarding's atmosphere down to pure black just for this one screen.
 */
const SPLASH_BACKGROUND = '#000000';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <AppLogo size={120} style={{ marginBottom: 20 }} />
        <AppText variant="displayMedium" color={onboardingGlass.textPrimary}>
          {brand.name}
        </AppText>
        <AppText variant="bodyMedium" color={onboardingGlass.textSecondary} style={{ marginTop: 4 }}>
          {t('splash.tagline')}
        </AppText>
      </Animated.View>
    </View>
  );
};
