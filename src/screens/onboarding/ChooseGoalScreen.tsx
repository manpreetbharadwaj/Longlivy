import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppIconName } from '@/components/common/AppIcon';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GoalCard } from '@/features/onboarding/components/GoalCard';
import { onboardingGoalColors } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Goal = NonNullable<OnboardingDraft['goal']>;

const GOALS: { key: Goal; icon: AppIconName; title: string; outcome: string }[] = [
  { key: 'weight_loss', icon: 'trending-down-outline', title: 'Lose weight', outcome: 'A steady calorie deficit, built into your daily target.' },
  { key: 'maintenance', icon: 'infinite-outline', title: 'Maintain weight', outcome: 'Hold steady — your targets track your baseline exactly.' },
  { key: 'muscle_gain', icon: 'trending-up-outline', title: 'Gain weight', outcome: 'A controlled surplus to support muscle, not just the scale.' },
];

/**
 * The bridge from "understanding Long Livy" to "building my personal Long
 * Livy profile" — deliberately the first thing asked, before any personal
 * information, and deliberately not counted as one of the seven numbered
 * personalization steps (see OnboardingStepLayout's `eyebrow`): everything
 * from here on — the body profile, the nutrient focus — is built *around*
 * this choice, so it has to come first. Asked exactly once; nothing later
 * in onboarding asks it again.
 */
export const ChooseGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      eyebrow="YOUR GOAL"
      title="What do you want to achieve?"
      subtitle="Long Livy builds your entire plan around this — your targets, your body profile, everything that follows."
      onNext={() => navigation.navigate('PersonalizeMe')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.goal}
    >
      {GOALS.map((g, index) => (
        <GoalCard
          key={g.key}
          goalKey={g.key}
          icon={g.icon}
          title={g.title}
          outcome={g.outcome}
          gradient={onboardingGoalColors[g.key].gradient}
          accent={onboardingGoalColors[g.key].accent}
          selected={draft.goal === g.key}
          index={index}
          onPress={() => update({ goal: g.key })}
        />
      ))}
    </OnboardingStepLayout>
  );
};
