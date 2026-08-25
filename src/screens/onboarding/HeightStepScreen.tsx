import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { RulerPicker } from '@/features/onboarding/components/RulerPicker';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const MIN_H = 120;
const MAX_H = 220;
const DEFAULT_HEIGHT = 170;

export const HeightStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { draft, update } = useOnboardingDraft();
  const heightCm = draft.heightCm ?? DEFAULT_HEIGHT;

  return (
    <OnboardingStepLayout
      step={4}
      totalSteps={7}
      title="How tall are you?"
      subtitle="Drag to set your height — watch your profile scale."
      onNext={() => navigation.navigate('Weight')}
      onBack={() => navigation.goBack()}
      dimBackground
    >
      {/* The same persistent character scales vertically in real time as the ruler below changes, with faint measurement ticks alongside for scale reference. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <HumanBodyVisualizer gender={draft.gender ?? 'diverse'} age={draft.age ?? 27} heightCm={heightCm} weightKg={draft.weightKg ?? 70} showHeightTicks width={180} height={240} />
      </View>
      <RulerPicker min={MIN_H} max={MAX_H} step={1} majorEvery={10} unit="cm" value={heightCm} onChange={(v) => update({ heightCm: v })} />
    </OnboardingStepLayout>
  );
};
