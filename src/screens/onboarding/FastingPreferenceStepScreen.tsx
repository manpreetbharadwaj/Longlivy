import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const OPTIONS: { key: NonNullable<OnboardingDraft['fastingMethod']>; label: string; desc: string }[] = [
  { key: '16:8', label: '16:8', desc: 'A daily 8-hour eating window — the most common starting point.' },
  { key: '18:6', label: '18:6', desc: 'A tighter daily eating window.' },
  { key: '24h', label: 'Occasional 24h fasts', desc: 'Longer, less frequent fasts.' },
  { key: 'none_yet', label: "I'm not sure yet", desc: 'You can explore methods later in the Fasting tab.' },
];

export const FastingPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={7}
      totalSteps={11}
      title="Fasting preference"
      subtitle="Sets your default fasting method — always changeable."
      onNext={() => navigation.navigate('MeditationPreferenceStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.fastingMethod}
    >
      {OPTIONS.map((o) => (
        <AppCard
          key={o.key}
          onPress={() => update({ fastingMethod: o.key })}
          style={{ marginBottom: theme.spacing.sm, borderColor: draft.fastingMethod === o.key ? theme.colors.primary : theme.colors.border, borderWidth: draft.fastingMethod === o.key ? 2 : 1 }}
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
