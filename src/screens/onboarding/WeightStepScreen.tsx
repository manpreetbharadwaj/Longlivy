import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { RulerPicker } from '@/features/onboarding/components/RulerPicker';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const DEFAULT_WEIGHT = 70;

export const WeightStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const weightKg = draft.weightKg ?? DEFAULT_WEIGHT;

  return (
    <OnboardingStepLayout
      step={5}
      totalSteps={7}
      title="What's your weight?"
      subtitle="Drag to set your current weight."
      onNext={() => navigation.navigate('ActivityLevelStep')}
      onBack={() => navigation.goBack()}
      dimBackground
    >
      {/* Same persistent character, still carrying gender/age/height from the earlier steps — only weight moves the body-volume morph here. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <HumanBodyVisualizer gender={draft.gender ?? 'diverse'} age={draft.age ?? 27} heightCm={draft.heightCm ?? 170} weightKg={weightKg} width={180} height={240} />
      </View>
      <RulerPicker min={35} max={180} step={1} majorEvery={10} unit="kg" value={weightKg} onChange={(v) => update({ weightKg: v })} />
      <AppText variant="caption" color={onboardingGlass.textTertiary} align="center" style={{ marginTop: theme.spacing.sm }}>
        A visual reference for your profile — never a judgment.
      </AppText>
    </OnboardingStepLayout>
  );
};
