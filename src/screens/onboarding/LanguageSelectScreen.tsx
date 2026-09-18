import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppLogo } from '@/components/common/AppLogo';
import { LanguageWheelPicker } from '@/components/common/LanguageWheelPicker';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingAccentDeep, onboardingNeutral, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { LANGUAGES } from '@/config/languages';
import { useTranslation } from '@/localization';

/**
 * First-launch language gate — shown by `RootNavigator` before the
 * onboarding flow whenever `preferences.languageSelected` is false (only a
 * truly fresh install). Reuses the onboarding atmosphere so it introduces
 * no new visual language. A worldwide wheel (`LanguageWheelPicker`, driven
 * entirely by the centralized `LANGUAGES` registry — see `@/config/languages`)
 * replaces the old two-option card list. Spinning the wheel applies the
 * language immediately (live preview of this screen's own copy, including
 * text direction for Arabic/Urdu); "Continue" confirms — which flips
 * `languageSelected`, causing `RootNavigator` to swap this screen out for
 * `Onboarding` in the chosen language.
 */
export const LanguageSelectScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { preferences, setLanguage } = useAppPreferences();
  const [selected, setSelected] = useState<string>(preferences.language);

  const choose = (code: string) => {
    setSelected(code);
    // Live preview only — don't mark the language as chosen yet, or the
    // RootNavigator gate would drop this screen before "Continue". The
    // native RTL flag itself only actually flips (and only takes full
    // effect) once "Continue" commits the choice — see useRtlSync — so a
    // mid-spin preview never triggers a reload.
    setLanguage(code as AppLanguage, { markSelected: false });
  };

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, padding: theme.spacing.md, alignItems: 'center', justifyContent: 'center' }}>
          <FadeSlideIn fromY={10} style={{ alignItems: 'center' }}>
            <AppLogo size={56} style={{ marginBottom: theme.spacing.md }} />
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs} style={{ alignItems: 'center' }}>
            <AppText variant="displayMedium" color={onboardingGlass.textPrimary} align="center">
              {t('language.selectTitle')}
            </AppText>
            <AppText
              variant="bodyLarge"
              color={onboardingGlass.textSecondary}
              align="center"
              style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}
            >
              {t('language.selectSubtitle')}
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 2} style={{ width: '100%' }}>
            <LanguageWheelPicker
              languages={LANGUAGES}
              selectedCode={selected}
              onChange={choose}
              glowColor={onboardingAccent}
              centerColor={onboardingGlass.textPrimary}
              regularColor={onboardingNeutral}
              hapticsEnabled={preferences.hapticsEnabled}
            />
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.staggerStepMs * 3} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label={t('language.continueCta')} onPress={() => setLanguage(selected as AppLanguage)} colors={[onboardingAccent, onboardingAccentDeep]} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
