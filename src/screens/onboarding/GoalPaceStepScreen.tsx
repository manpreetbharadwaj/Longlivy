import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { onboardingAccent } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const PACE_OPTIONS = [0.25, 0.5, 0.75, 1] as const;

/**
 * Only ever pushed for a weight_loss/muscle_gain goal (see ChooseGoalScreen,
 * which routes straight past this to FastingPreference for maintenance).
 * Feeds `CalorieCalculationEngine.calculateCalorieGoal`'s optional pace
 * parameter directly — 0.5 kg/week is roughly a 550 kcal/day deficit — in
 * place of that method's original fixed ±500/+300 estimate.
 */
export const GoalPaceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const losing = draft.goal === 'weight_loss';

  return (
    <OnboardingStepLayout
      step={8}
      totalSteps={9}
      title={losing ? 'How fast do you want to lose?' : 'How fast do you want to gain?'}
      subtitle="A steadier pace is easier to sustain — you can always change this later."
      onNext={() => navigation.navigate('FastingPreference')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.weightChangePaceKgPerWeek}
      dimBackground
    >
      {PACE_OPTIONS.map((pace) => (
        <HeroOptionCard
          key={pace}
          title={`${pace} kg / week`}
          description={pace <= 0.5 ? 'Gradual and easy to maintain.' : pace === 0.75 ? 'A brisker, still reasonable pace.' : 'The fastest pace we recommend.'}
          selected={draft.weightChangePaceKgPerWeek === pace}
          accentColor={onboardingAccent}
          onPress={() => update({ weightChangePaceKgPerWeek: pace })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
