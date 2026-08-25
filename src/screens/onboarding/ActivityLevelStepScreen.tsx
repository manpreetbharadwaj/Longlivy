import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { onboardingAccent } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Level = NonNullable<OnboardingDraft['activityLevel']>;

// Labels match the client-specified five-tier wording; internal keys stay
// aligned with BodyProfile/CalorieCalculationEngine's existing enum so the
// activity-multiplier logic downstream is untouched.
const LEVELS: { key: Level; label: string; desc: string }[] = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk job.' },
  { key: 'light', label: 'Lightly active', desc: 'Light exercise 1–3 days a week.' },
  { key: 'moderate', label: 'Moderately active', desc: 'Moderate exercise 3–5 days a week.' },
  { key: 'active', label: 'Very active', desc: 'Hard exercise 6–7 days a week.' },
  { key: 'very_active', label: 'Extremely active', desc: 'Physical job or twice-daily training.' },
];

const BAR_MIN = 14;
const BAR_STEP = 13;

const EnergyBar: React.FC<{ index: number; active: boolean }> = ({ index, active }) => {
  const height = useSharedValue(BAR_MIN);
  const opacity = useSharedValue(0.26);

  useEffect(() => {
    const targetHeight = BAR_MIN + index * BAR_STEP;
    height.value = withDelay(index * 40, withTiming(active ? targetHeight : BAR_MIN, { duration: motion.duration.base, easing: motion.easing.standard }));
    opacity.value = withDelay(index * 40, withTiming(active ? 1 : 0.26, { duration: motion.duration.base }));
  }, [active, index, height, opacity]);

  const style = useAnimatedStyle(() => ({ height: height.value, opacity: opacity.value }));

  return <Animated.View style={[{ width: 15, marginHorizontal: 5, borderRadius: 8, backgroundColor: onboardingAccent }, style]} />;
};

/** A 5-bar "energy meter" that fills progressively taller as a higher activity level is selected — communicated visually, not just by label. */
const ActivityHeroVisual: React.FC<{ level: Level | null }> = ({ level }) => {
  const selectedIndex = level ? LEVELS.findIndex((l) => l.key === level) : -1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: BAR_MIN + 4 * BAR_STEP + 8, marginBottom: 8 }}>
      {LEVELS.map((l, i) => (
        <EnergyBar key={l.key} index={i} active={i <= selectedIndex} />
      ))}
    </View>
  );
};

export const ActivityLevelStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={6}
      totalSteps={7}
      title="How active are you?"
      subtitle="Feeds your estimated daily energy use."
      onNext={() => navigation.navigate('Micronutrients')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.activityLevel}
    >
      <ActivityHeroVisual level={draft.activityLevel} />
      {LEVELS.map((l) => (
        <HeroOptionCard
          key={l.key}
          title={l.label}
          description={l.desc}
          selected={draft.activityLevel === l.key}
          accentColor={onboardingAccent}
          onPress={() => update({ activityLevel: l.key })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
