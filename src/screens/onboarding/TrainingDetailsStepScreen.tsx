import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { RulerPicker } from '@/features/onboarding/components/RulerPicker';
import { onboardingAccent } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Volume = NonNullable<OnboardingDraft['trainingVolume']>;

const VOLUMES: { key: Volume; label: string; desc: string }[] = [
  { key: 'low', label: 'Low volume', desc: 'Short sessions, or still finding your rhythm.' },
  { key: 'moderate', label: 'Moderate volume', desc: 'Solid 30–60 minute sessions.' },
  { key: 'high', label: 'High volume', desc: 'Long and/or multiple sessions per day.' },
];

const DEFAULT_FREQUENCY = 3;

/**
 * Distinct from ActivityLevelStepScreen — that captures overall daily
 * movement (feeds the calorie-multiplier tier), this captures deliberate
 * training specifically: how often, and how much ground each session
 * covers. Both are asked because the client's calculation inputs list them
 * separately.
 */
export const TrainingDetailsStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const frequency = draft.trainingFrequency ?? DEFAULT_FREQUENCY;

  return (
    <OnboardingStepLayout
      step={6}
      totalSteps={9}
      title="How do you train?"
      subtitle="Sessions per week, and how much ground each one covers."
      onNext={() => navigation.navigate('ChooseGoal')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.trainingVolume}
      dimBackground
    >
      <RulerPicker min={0} max={14} step={1} majorEvery={7} unit="sessions/wk" value={frequency} onChange={(v) => update({ trainingFrequency: v })} />
      <View style={{ marginTop: theme.spacing.lg }}>
        {VOLUMES.map((v) => (
          <HeroOptionCard
            key={v.key}
            title={v.label}
            description={v.desc}
            selected={draft.trainingVolume === v.key}
            accentColor={onboardingAccent}
            onPress={() => update({ trainingVolume: v.key })}
            style={{ marginBottom: theme.spacing.sm }}
          />
        ))}
      </View>
    </OnboardingStepLayout>
  );
};
