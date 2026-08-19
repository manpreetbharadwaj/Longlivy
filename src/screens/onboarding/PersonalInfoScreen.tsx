import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroTextField } from '@/components/common/HeroTextField';
import { HeroChip } from '@/components/common/HeroChip';
import { AppText } from '@/components/common/AppText';
import { AppDateField } from '@/components/common/AppDateField';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const GENDERS = [
  { key: 'female' as const, label: 'Female' },
  { key: 'male' as const, label: 'Male' },
  { key: 'diverse' as const, label: 'Diverse' },
];

/** A slow, continuous breathing silhouette — minimal and elegant rather than illustrative, echoing the calm-but-alive feel of the Welcome mark. */
const ProfileHeroVisual: React.FC = () => {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200, easing: motion.easing.standard }),
        withTiming(1, { duration: 2200, easing: motion.easing.standard })
      ),
      -1,
      false
    );
  }, [breathe]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={104} color="#5FBFAE" opacity={0.32} />
        <Animated.View
          style={[
            { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderColor: 'rgba(95,191,174,0.55)', alignItems: 'center', justifyContent: 'center' },
            animatedStyle,
          ]}
        >
          <AppIcon name="person-outline" size={30} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

export const PersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const valid = draft.firstName.trim().length > 0 && draft.heightCm.length > 0 && draft.weightKg.length > 0 && !!draft.gender;

  return (
    <OnboardingStepLayout
      variant="hero"
      step={4}
      totalSteps={11}
      title="A bit about you"
      subtitle="Used to personalize your calorie and nutrition calculations."
      onNext={() => navigation.navigate('ActivityLevelStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!valid}
    >
      <ProfileHeroVisual />
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroTextField label="First name" value={draft.firstName} onChangeText={(v) => update({ firstName: v })} placeholder="Alex" />
        </View>
        <View style={{ flex: 1 }}>
          <HeroTextField label="Last name" value={draft.lastName} onChangeText={(v) => update({ lastName: v })} placeholder="Rivera" />
        </View>
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppDateField
          variant="hero"
          label="Date of birth"
          mode="date"
          value={draft.dateOfBirth ? new Date(draft.dateOfBirth) : new Date(1995, 0, 1)}
          maximumDate={new Date()}
          onChange={(date) => update({ dateOfBirth: date.toISOString().slice(0, 10) })}
        />
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>
        <AppText variant="label" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.xxs }}>
          Gender
        </AppText>
        <View style={{ flexDirection: 'row' }}>
          {GENDERS.map((g) => (
            <HeroChip key={g.key} label={g.label} selected={draft.gender === g.key} onPress={() => update({ gender: g.key })} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroTextField label="Height (cm)" value={draft.heightCm} onChangeText={(v) => update({ heightCm: v })} keyboardType="numeric" placeholder="176" />
        </View>
        <View style={{ flex: 1 }}>
          <HeroTextField label="Weight (kg)" value={draft.weightKg} onChangeText={(v) => update({ weightKg: v })} keyboardType="numeric" placeholder="78" />
        </View>
      </View>
    </OnboardingStepLayout>
  );
};
