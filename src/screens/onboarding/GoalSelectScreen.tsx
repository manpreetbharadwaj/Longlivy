import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useSelectionHaptic } from '@/hooks/useSelectionHaptic';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GOALS } from '@/features/onboarding/goals/goalConfig';
import { GoalKey } from '@/features/onboarding/goals/types';
import { onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

/**
 * The entry point for goal-based onboarding: "why is this person here".
 * Deliberately not counted as one of the six numbered common steps (see
 * OnboardingStepLayout's `eyebrow`) — it's the choice everything else in
 * onboarding is generated from, same beat-screen treatment as the
 * weight-direction Goal screen right after it.
 *
 * Multi-select, not single: a user can genuinely want Yoga + Meditation +
 * Activity together, and forcing one goal would mean asking the same
 * common questions three separate times to actually serve them. "Up to 3"
 * is a recommendation shown as copy, never an enforced cap.
 */
export const GoalSelectScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();
  const fireHaptic = useSelectionHaptic();

  const toggle = useCallback(
    (key: GoalKey) => {
      fireHaptic();
      const next = draft.selectedGoals.includes(key) ? draft.selectedGoals.filter((k) => k !== key) : [...draft.selectedGoals, key];
      update({ selectedGoals: next });
    },
    [draft.selectedGoals, update, fireHaptic]
  );

  const goNext = useCallback(() => {
    const selected = draft.selectedGoals;
    if (selected.length === 0) return;
    if (selected.length === 1) {
      update({ primaryGoal: selected[0] });
      navigation.navigate('Goal');
    } else {
      navigation.navigate('PrimaryGoal');
    }
  }, [draft.selectedGoals, update, navigation]);

  return (
    <OnboardingStepLayout
      title={t('onboarding.goals.heading')}
      subtitle={t('onboarding.goals.subheading')}
      onNext={goNext}
      onBack={() => navigation.goBack()}
      nextDisabled={draft.selectedGoals.length === 0}
    >
      <AppText variant="caption" color={onboardingGlass.textTertiary} style={{ marginBottom: theme.spacing.sm }}>
        {t('onboarding.goals.recommendation')}
      </AppText>
      {GOALS.map((goal, index) => (
        <FadeSlideIn key={goal.key} delay={motion.staggerStepMs * 1.2 * index} fromY={16}>
          <HeroOptionCard
            icon={goal.icon}
            family={goal.family}
            title={t(goal.titleKey)}
            description={t(goal.subtitleKey)}
            selected={draft.selectedGoals.includes(goal.key)}
            accentColor={goal.accent}
            onPress={() => toggle(goal.key)}
            style={{ marginBottom: theme.spacing.sm }}
          />
        </FadeSlideIn>
      ))}
      <View style={{ height: theme.spacing.md }} />
    </OnboardingStepLayout>
  );
};
