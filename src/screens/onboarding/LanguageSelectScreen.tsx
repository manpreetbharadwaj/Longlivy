import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingCtaGradient, onboardingData, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { useTranslation } from '@/localization';

interface LanguageOption {
  code: AppLanguage;
  /** The language's own endonym — always shown in that language, never translated. */
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'de', nativeName: 'Deutsch' },
];

/**
 * First-launch language gate — shown by `RootNavigator` before the
 * onboarding flow whenever `preferences.languageSelected` is false (only a
 * truly fresh install). Reuses the onboarding atmosphere + `HeroOptionCard`
 * so it introduces no new visual language. Tapping an option applies the
 * language immediately (live preview of this screen's own copy); "Continue"
 * confirms — which flips `languageSelected`, causing `RootNavigator` to
 * swap this screen out for `Onboarding` in the chosen language.
 */
export const LanguageSelectScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { preferences, setLanguage } = useAppPreferences();
  const [selected, setSelected] = useState<AppLanguage>(preferences.language);

  const choose = (code: AppLanguage) => {
    setSelected(code);
    // Live preview only — don't mark the language as chosen yet, or the
    // RootNavigator gate would drop this screen before "Continue".
    setLanguage(code, { markSelected: false });
  };

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: theme.spacing.md, justifyContent: 'center' }}>
          <FadeSlideIn fromY={10}>
            <AppText variant="caption" color={onboardingData} style={{ letterSpacing: 3, marginBottom: theme.spacing.sm }}>
              LONGLIVY
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs}>
            <AppText variant="displayMedium" color={onboardingGlass.textPrimary}>
              {t('language.selectTitle')}
            </AppText>
            <AppText variant="bodyLarge" color={onboardingGlass.textSecondary} style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
              {t('language.selectSubtitle')}
            </AppText>
          </FadeSlideIn>

          <View style={{ gap: theme.spacing.sm }}>
            {LANGUAGES.map((lang, i) => (
              <FadeSlideIn key={lang.code} delay={motion.staggerStepMs * (i + 2)} fromY={8}>
                <HeroOptionCard
                  title={lang.nativeName}
                  description={t(`language.${lang.code === 'en' ? 'englishName' : 'germanName'}` as const)}
                  selected={selected === lang.code}
                  onPress={() => choose(lang.code)}
                  accentColor={onboardingAccent}
                />
              </FadeSlideIn>
            ))}
          </View>
        </View>

        <FadeSlideIn delay={motion.staggerStepMs * 5} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label={t('language.continueCta')} onPress={() => setLanguage(selected)} colors={onboardingCtaGradient} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
