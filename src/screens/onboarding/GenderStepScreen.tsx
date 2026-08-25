import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GenderCard } from '@/features/onboarding/components/GenderCard';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { OnboardingStepLayout } from './OnboardingStepLayout';

// Order is client-specified and load-bearing: Male, then Female, then
// Diverse / Other — do not reorder.
const OPTIONS = [
  { key: 'male' as const, label: 'Male' },
  { key: 'female' as const, label: 'Female' },
  { key: 'diverse' as const, label: 'Diverse / Other' },
];

export const GenderStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={2}
      totalSteps={7}
      title="Let's start with you"
      subtitle="This calibrates your baseline calculations."
      onNext={() => navigation.navigate('Age')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.gender}
      dimBackground
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        {OPTIONS.map((o) => (
          <GenderCard key={o.key} kind={o.key} label={o.label} selected={draft.gender === o.key} onPress={() => update({ gender: o.key })} />
        ))}
      </View>

      {/* The empty lower area becomes the start of the user's digital profile — a non-interactive body silhouette that carries forward, gradually filled in, through Age/Height/Weight. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.sm }}>
        <HumanBodyVisualizer gender={draft.gender ?? 'diverse'} age={draft.age ?? 27} heightCm={draft.heightCm ?? 170} weightKg={draft.weightKg ?? 70} />
      </View>
    </OnboardingStepLayout>
  );
};
