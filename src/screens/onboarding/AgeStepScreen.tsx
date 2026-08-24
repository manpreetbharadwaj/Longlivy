import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppDateField } from '@/components/common/AppDateField';
import { useOnboardingDraft, ageFromDateOfBirth } from '@/features/onboarding/OnboardingContext';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const MIN_AGE = 13;
const MAX_AGE = 90;
const DEFAULT_DOB = new Date(new Date().getFullYear() - 27, 0, 1);

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const now = new Date();
const MAX_DOB = new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate()); // must be at least MIN_AGE
const MIN_DOB = new Date(now.getFullYear() - MAX_AGE, now.getMonth(), now.getDate()); // no older than MAX_AGE

/**
 * Captures the actual date of birth — the source of truth the registration/
 * calorie-calculation schema expects — rather than a raw age. `age` (still
 * kept in the draft for every downstream consumer that just wants a plain
 * number: the calorie engine, the body visualizer's age-bucket lookup) is
 * derived from it via `ageFromDateOfBirth` the moment a date is picked.
 */
export const AgeStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { draft, update } = useOnboardingDraft();
  const dob = draft.dateOfBirth ? new Date(draft.dateOfBirth) : DEFAULT_DOB;
  const age = draft.age ?? ageFromDateOfBirth(toIsoDate(dob));

  return (
    <OnboardingStepLayout
      step={2}
      totalSteps={9}
      title="When's your birthday?"
      subtitle="Used to calibrate your baseline calculations."
      onNext={() => navigation.navigate('Height')}
      onBack={() => navigation.goBack()}
      dimBackground
    >
      {/* Same persistent character carried over from the Gender step — only its age input changes here, the model itself never resets. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <HumanBodyVisualizer gender={draft.gender ?? 'diverse'} age={age} heightCm={draft.heightCm ?? 170} weightKg={draft.weightKg ?? 70} width={180} height={240} />
      </View>
      <AppDateField
        label="Date of birth"
        mode="date"
        variant="hero"
        value={dob}
        maximumDate={MAX_DOB}
        minimumDate={MIN_DOB}
        onChange={(selected) => {
          const iso = toIsoDate(selected);
          update({ dateOfBirth: iso, age: ageFromDateOfBirth(iso) });
        }}
      />
    </OnboardingStepLayout>
  );
};
