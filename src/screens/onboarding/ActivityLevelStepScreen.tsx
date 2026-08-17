import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const LEVELS: { key: NonNullable<OnboardingDraft['activityLevel']>; label: string; desc: string }[] = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk job.' },
  { key: 'light', label: 'Lightly active', desc: 'Light exercise 1–3 days a week.' },
  { key: 'moderate', label: 'Moderately active', desc: 'Moderate exercise 3–5 days a week.' },
  { key: 'active', label: 'Active', desc: 'Hard exercise 6–7 days a week.' },
  { key: 'very_active', label: 'Very active', desc: 'Physical job or twice-daily training.' },
];

export const ActivityLevelStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={5}
      totalSteps={11}
      title="How active are you?"
      subtitle="Feeds your estimated total energy consumption."
      onNext={() => navigation.navigate('NutritionGoalsStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.activityLevel}
    >
      {LEVELS.map((l) => (
        <AppCard
          key={l.key}
          onPress={() => update({ activityLevel: l.key })}
          style={{
            marginBottom: theme.spacing.sm,
            borderColor: draft.activityLevel === l.key ? theme.colors.primary : theme.colors.border,
            borderWidth: draft.activityLevel === l.key ? 2 : 1,
          }}
        >
          <AppText variant="headingSmall">{l.label}</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {l.desc}
          </AppText>
        </AppCard>
      ))}
    </OnboardingStepLayout>
  );
};
