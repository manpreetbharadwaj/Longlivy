import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GoalCard } from '@/features/onboarding/components/GoalCard';
import { onboardingGoalColors } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Goal = NonNullable<OnboardingDraft['goal']>;

// Title + outcome resolved at render via `t('onboarding.goal.options.<key>')`.
const GOAL_KEYS: Goal[] = ['weight_loss', 'maintenance', 'muscle_gain'];

/**
 * The bridge from "understanding HealthyMe" to "building my personal
 * HealthyMe profile" — deliberately the first thing asked, before any
 * personal information, and deliberately not counted as one of the seven
 * numbered personalization steps (see OnboardingStepLayout's `eyebrow`):
 * everything from here on — the body profile, the nutrient focus — is
 * built *around* this choice, so it has to come first. Asked exactly once;
 * nothing later in onboarding asks it again.
 *
 * Deliberately headline-only (no subtitle) — the three goal cards are
 * visual and self-explanatory enough (icon, outcome line, animated trend)
 * that a supporting paragraph underneath the headline was redundant with
 * what the cards themselves already communicate.
 */
export const ChooseGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      eyebrow={t('onboarding.goal.eyebrow')}
      title={t('onboarding.goal.title')}
      onNext={() => navigation.navigate('PersonalizeMe')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.goal}
    >
      {GOAL_KEYS.map((key, index) => (
        // A tighter stagger than the app-wide default (1.5 steps instead of
        // 3) — three cards is little enough content that the original pace
        // stretched the entrance past the ~400-700ms this screen wants,
        // without the stagger actually reading as more polished for it.
        <FadeSlideIn key={key} delay={motion.staggerStepMs * 1.5 * index} fromY={20}>
          <GoalCard
            goalKey={key}
            title={t(`onboarding.goal.options.${key}.title`)}
            outcome={t(`onboarding.goal.options.${key}.outcome`)}
            gradient={onboardingGoalColors[key].gradient}
            accent={onboardingGoalColors[key].accent}
            selected={draft.goal === key}
            dimmed={!!draft.goal && draft.goal !== key}
            index={index}
            onPress={() => update({ goal: key })}
          />
        </FadeSlideIn>
      ))}
    </OnboardingStepLayout>
  );
};
