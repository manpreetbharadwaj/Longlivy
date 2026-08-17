import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppInput } from '@/components/common/AppInput';
import { AppChip } from '@/components/common/AppChip';
import { AppText } from '@/components/common/AppText';
import { AppDateField } from '@/components/common/AppDateField';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const GENDERS = [
  { key: 'female' as const, label: 'Female' },
  { key: 'male' as const, label: 'Male' },
  { key: 'diverse' as const, label: 'Diverse' },
];

export const PersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const valid = draft.firstName.trim().length > 0 && draft.heightCm.length > 0 && draft.weightKg.length > 0 && !!draft.gender;

  return (
    <OnboardingStepLayout
      step={4}
      totalSteps={11}
      title="A bit about you"
      subtitle="Used to personalize your calorie and nutrition calculations."
      onNext={() => navigation.navigate('ActivityLevelStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!valid}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput label="First name" value={draft.firstName} onChangeText={(v) => update({ firstName: v })} placeholder="Alex" />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput label="Last name" value={draft.lastName} onChangeText={(v) => update({ lastName: v })} placeholder="Rivera" />
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppDateField
          label="Date of birth"
          mode="date"
          value={draft.dateOfBirth ? new Date(draft.dateOfBirth) : new Date(1995, 0, 1)}
          maximumDate={new Date()}
          onChange={(date) => update({ dateOfBirth: date.toISOString().slice(0, 10) })}
        />
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppText variant="label" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xxs }}>
          Gender
        </AppText>
        <View style={{ flexDirection: 'row' }}>
          {GENDERS.map((g) => (
            <AppChip key={g.key} label={g.label} selected={draft.gender === g.key} onPress={() => update({ gender: g.key })} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput label="Height (cm)" value={draft.heightCm} onChangeText={(v) => update({ heightCm: v })} keyboardType="numeric" placeholder="176" />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput label="Weight (kg)" value={draft.weightKg} onChangeText={(v) => update({ weightKg: v })} keyboardType="numeric" placeholder="78" />
        </View>
      </View>
    </OnboardingStepLayout>
  );
};
