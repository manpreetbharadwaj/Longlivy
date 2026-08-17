import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const OPTIONS: { key: NonNullable<OnboardingDraft['nutritionFocus']>; label: string; desc: string }[] = [
  { key: 'balanced', label: 'Balanced', desc: 'Even split across protein, carbs and fat.' },
  { key: 'high_protein', label: 'High protein', desc: 'Prioritize protein intake for training or satiety.' },
  { key: 'low_carb', label: 'Lower carb', desc: 'Reduce carbohydrates relative to fat and protein.' },
];

export const NutritionGoalsStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={6}
      totalSteps={11}
      title="Nutrition focus"
      subtitle="We'll set starting macro targets — fully adjustable later."
      onNext={() => navigation.navigate('FastingPreferenceStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.nutritionFocus}
    >
      {OPTIONS.map((o) => (
        <AppCard
          key={o.key}
          onPress={() => update({ nutritionFocus: o.key })}
          style={{ marginBottom: theme.spacing.sm, borderColor: draft.nutritionFocus === o.key ? theme.colors.primary : theme.colors.border, borderWidth: draft.nutritionFocus === o.key ? 2 : 1 }}
        >
          <AppText variant="headingSmall">{o.label}</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {o.desc}
          </AppText>
        </AppCard>
      ))}
    </OnboardingStepLayout>
  );
};
