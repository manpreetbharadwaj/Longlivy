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

/** Not the last personalization step anymore — a chosen weight_loss/muscle_gain goal is followed by GoalPace (how fast), skipped entirely for maintenance since a pace isn't meaningful there. */
export const ChooseGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={7}
      totalSteps={9}
      title="What's your goal?"
      subtitle="This shapes your calorie target — changeable anytime."
      onNext={() => navigation.navigate(draft.goal === 'maintenance' ? 'FastingPreference' : 'GoalPace')}
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
