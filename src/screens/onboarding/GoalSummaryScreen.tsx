import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GOALS } from '@/features/onboarding/goals/goalConfig';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingCtaGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

/** Same "en dash" join HealthyMe uses for other short deterministic lists (e.g. splash's pillar tagline) — never a generated sentence. */
function joinFocus(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * The goal-focused recap — deliberately separate from CompleteSetupScreen,
 * which is the actual calorie-plan computation. This screen only reflects
 * back the focus areas just chosen, built from fixed per-goal blurb copy
 * (`onboarding.goalSummary.blurbs`) joined deterministically — never
 * generated text, per spec.
 */
export const GoalSummaryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft } = useOnboardingDraft();

  const orderedGoals = useMemo(() => {
    const primary = draft.primaryGoal;
    const selected = GOALS.filter((g) => draft.selectedGoals.includes(g.key));
    if (!primary) return selected;
    return [...selected.filter((g) => g.key === primary), ...selected.filter((g) => g.key !== primary)];
  }, [draft.selectedGoals, draft.primaryGoal]);

  const focusLine = orderedGoals.map((g) => t(g.titleKey)).join('  •  ');
  const blurbItems = orderedGoals.map((g) => t(`onboarding.goalSummary.blurbs.${g.key}` as TranslationKey));

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
          <FadeSlideIn>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: `${onboardingAccent}29`,
                borderWidth: 1.5,
                borderColor: onboardingAccent,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginBottom: theme.spacing.lg,
              }}
            >
              <AppIcon name="checkmark" size={30} color="#FFFFFF" />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 2}>
            <AppText variant="displayMedium" align="center" color={onboardingGlass.textPrimary} style={{ marginBottom: theme.spacing.lg }}>
              {t('onboarding.goalSummary.title')}
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 3}>
            <AppText variant="label" color={onboardingAccent} align="center" style={{ letterSpacing: 1, marginBottom: 4 }}>
              {t('onboarding.goalSummary.yourFocus').toUpperCase()}
            </AppText>
            <AppText variant="headingSmall" align="center" color={onboardingGlass.textPrimary} style={{ marginBottom: theme.spacing.lg }}>
              {focusLine}
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 4}>
            <AppText variant="bodyMedium" align="center" color={onboardingGlass.textSecondary} style={{ maxWidth: 320 }}>
              {t('onboarding.goalSummary.body', { items: joinFocus(blurbItems) })}
            </AppText>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.staggerStepMs * 6} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label={t('onboarding.goalSummary.continueCta')} onPress={() => navigation.navigate('CompleteSetup')} colors={onboardingCtaGradient} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
