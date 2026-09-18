import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useSelectionHaptic } from '@/hooks/useSelectionHaptic';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GOALS } from '@/features/onboarding/goals/goalConfig';
import { GoalKey } from '@/features/onboarding/goals/types';
import { OnboardingStepLayout } from './OnboardingStepLayout';

/**
 * Only reached when more than one goal was selected (see GoalSelectScreen).
 * Doesn't remove or hide the other goals — it just decides which one's
 * questions the generated flow asks first (`buildGoalFlow`), and later,
 * which pillar Home gives top billing to. Every selected goal stays a
 * "secondary" goal that still gets its own questions later in the flow.
 */
export const PrimaryGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();
  const fireHaptic = useSelectionHaptic();

  const options = GOALS.filter((g) => draft.selectedGoals.includes(g.key));
  // Keeps a still-valid previous choice pre-selected (e.g. the user went
  // back and only removed an unrelated goal); an orphaned one (the goal
  // itself was deselected) shows nothing pre-selected rather than silently
  // keeping an invalid value.
  const selected = draft.primaryGoal && draft.selectedGoals.includes(draft.primaryGoal) ? draft.primaryGoal : null;

  const choose = useCallback(
    (key: GoalKey) => {
      fireHaptic();
      update({ primaryGoal: key });
    },
    [update, fireHaptic]
  );

  return (
    <OnboardingStepLayout
      eyebrow={t('onboarding.goals.primary.eyebrow')}
      title={t('onboarding.goals.primary.title')}
      subtitle={t('onboarding.goals.primary.subtitle')}
      onNext={() => navigation.navigate('Goal')}
      onBack={() => navigation.goBack()}
      nextDisabled={!selected}
    >
      {options.map((goal, index) => (
        <FadeSlideIn key={goal.key} delay={motion.staggerStepMs * 1.2 * index} fromY={16}>
          <HeroOptionCard
            icon={goal.icon}
            family={goal.family}
            title={t(goal.titleKey)}
            selected={selected === goal.key}
            accentColor={goal.accent}
            onPress={() => choose(goal.key)}
            style={{ marginBottom: theme.spacing.sm }}
          />
        </FadeSlideIn>
      ))}
    </OnboardingStepLayout>
  );
};
