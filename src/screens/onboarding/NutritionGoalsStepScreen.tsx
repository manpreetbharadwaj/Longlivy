import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { HeroLegendDot } from '@/components/common/HeroLegendDot';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Focus = NonNullable<OnboardingDraft['nutritionFocus']>;

const OPTIONS: { key: Focus; label: string; desc: string }[] = [
  { key: 'balanced', label: 'Balanced', desc: 'Even split across protein, carbs and fat.' },
  { key: 'high_protein', label: 'High protein', desc: 'Prioritize protein intake for training or satiety.' },
  { key: 'low_carb', label: 'Lower carb', desc: 'Reduce carbohydrates relative to fat and protein.' },
];

const NUTRITION_COLOR = '#E7A868';
const CARB_COLOR = '#6AA3DE';
const PROTEIN_COLOR = '#E7A868';
const FAT_COLOR = '#9B7FD9';

/** Illustrative macro split per focus — a visual cue during onboarding, not the app's actual macro calculation (that lives in the nutrition engine and stays untouched). */
const SPLITS: Record<Focus, { carb: number; protein: number; fat: number }> = {
  balanced: { carb: 0.4, protein: 0.3, fat: 0.3 },
  high_protein: { carb: 0.25, protein: 0.45, fat: 0.3 },
  low_carb: { carb: 0.15, protein: 0.35, fat: 0.5 },
};
const DEFAULT_SPLIT = { carb: 0.34, protein: 0.33, fat: 0.33 };

const RING_SIZE = 110;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A 3-segment ring that smoothly redistributes between carb/protein/fat proportions as the user picks a nutrition focus. */
const NutritionHeroVisual: React.FC<{ focus: Focus | null }> = ({ focus }) => {
  const target = focus ? SPLITS[focus] : DEFAULT_SPLIT;
  const carb = useSharedValue(DEFAULT_SPLIT.carb);
  const protein = useSharedValue(DEFAULT_SPLIT.protein);
  const fat = useSharedValue(DEFAULT_SPLIT.fat);

  useEffect(() => {
    carb.value = withTiming(target.carb, { duration: motion.duration.slow, easing: motion.easing.standard });
    protein.value = withTiming(target.protein, { duration: motion.duration.slow, easing: motion.easing.standard });
    fat.value = withTiming(target.fat, { duration: motion.duration.slow, easing: motion.easing.standard });
  }, [focus, target.carb, target.protein, target.fat, carb, protein, fat]);

  const carbProps = useAnimatedProps(() => ({ strokeDasharray: `${carb.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: 0 }));
  const proteinProps = useAnimatedProps(() => ({ strokeDasharray: `${protein.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: -carb.value * CIRCUMFERENCE }));
  const fatProps = useAnimatedProps(() => ({
    strokeDasharray: `${fat.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    strokeDashoffset: -(carb.value + protein.value) * CIRCUMFERENCE,
  }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={CARB_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={carbProps} />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={PROTEIN_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={proteinProps} />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={FAT_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={fatProps} />
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <HeroLegendDot color={CARB_COLOR} label="Carbs" />
        <HeroLegendDot color={PROTEIN_COLOR} label="Protein" />
        <HeroLegendDot color={FAT_COLOR} label="Fat" />
      </View>
    </View>
  );
};

export const NutritionGoalsStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={6}
      totalSteps={11}
      title="Nutrition focus"
      subtitle="We'll set starting macro targets — fully adjustable later."
      onNext={() => navigation.navigate('FastingPreferenceStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.nutritionFocus}
    >
      <NutritionHeroVisual focus={draft.nutritionFocus} />
      {OPTIONS.map((o) => (
        <HeroOptionCard
          key={o.key}
          title={o.label}
          description={o.desc}
          selected={draft.nutritionFocus === o.key}
          accentColor={NUTRITION_COLOR}
          onPress={() => update({ nutritionFocus: o.key })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
