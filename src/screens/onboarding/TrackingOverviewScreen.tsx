import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppCard } from '@/components/common/AppCard';
import { useTheme } from '@/hooks/useTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

export const TrackingOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  return (
    <OnboardingStepLayout
      step={2}
      totalSteps={11}
      title="Data that connects itself"
      subtitle="Longlivy links what you track — not just stores it."
      onNext={() => navigation.navigate('ChooseGoal')}
      onBack={() => navigation.goBack()}
    >
      <AppCard>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
          Fasting → activity → energy expenditure → diet → calorie intake → nutritional values → daily
          balance → progress → history → personal evaluation.
        </AppText>
      </AppCard>
      <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.md }}>
        You stay in control — Longlivy never overwrites or deletes an entry automatically. Estimated
        values are always labeled as estimates.
      </AppText>
    </OnboardingStepLayout>
  );
};
