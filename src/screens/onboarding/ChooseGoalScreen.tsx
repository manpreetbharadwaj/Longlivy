import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Goal = NonNullable<OnboardingDraft['goal']>;

const GOALS: { key: Goal; label: string; icon: AppIconName; color: string }[] = [
  { key: 'weight_loss', label: 'Weight loss', icon: 'trending-down-outline', color: '#5FBFAE' },
  { key: 'maintenance', label: 'Weight maintenance', icon: 'scale-outline', color: '#6AA3DE' },
  { key: 'general_wellness', label: 'General wellness', icon: 'leaf-outline', color: '#9B7FD9' },
  { key: 'muscle_gain', label: 'Muscle gain', icon: 'barbell-outline', color: '#E7A868' },
];

/**
 * The visual header — a glowing icon tile that swaps icon/color and gives a
 * quick confirming pulse whenever the selected goal changes, so the choice
 * feels acknowledged rather than just recording a tap.
 */
const GoalHeroVisual: React.FC<{ goal: Goal | null }> = ({ goal }) => {
  const active = goal ? GOALS.find((g) => g.key === goal)! : null;
  const color = active?.color ?? '#5FBFAE';
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withTiming(1.14, { duration: 160, easing: motion.easing.decelerate }), withTiming(1, { duration: 220, easing: motion.easing.standard }));
  }, [goal, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={120} color={color} opacity={0.4} pulse />
        <Animated.View
          style={[
            {
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: `${color}33`,
              borderWidth: 1.5,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            },
            animatedStyle,
          ]}
        >
          <AppIcon name={active?.icon ?? 'sparkles-outline'} size={32} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

export const ChooseGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={3}
      totalSteps={11}
      title="What's your primary goal?"
      subtitle="This shapes your default calorie and macro targets — you can change it anytime."
      onNext={() => navigation.navigate('PersonalInfo')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.goal}
    >
      <GoalHeroVisual goal={draft.goal} />
      {GOALS.map((g) => (
        <HeroOptionCard
          key={g.key}
          icon={g.icon}
          title={g.label}
          selected={draft.goal === g.key}
          accentColor={g.color}
          onPress={() => update({ goal: g.key })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
