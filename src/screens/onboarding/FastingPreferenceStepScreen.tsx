import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { HeroLegendDot } from '@/components/common/HeroLegendDot';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Method = NonNullable<OnboardingDraft['fastingMethod']>;

const OPTIONS: { key: Method; label: string; desc: string }[] = [
  { key: '16:8', label: '16:8', desc: 'A daily 8-hour eating window — the most common starting point.' },
  { key: '18:6', label: '18:6', desc: 'A tighter daily eating window.' },
  { key: '24h', label: 'Occasional 24h fasts', desc: 'Longer, less frequent fasts.' },
  { key: 'none_yet', label: "I'm not sure yet", desc: 'You can explore methods later in the Fasting tab.' },
];

const FASTING_COLOR = '#5FBFAE';
const EATING_COLOR = '#E7A868';

/** Illustrative eating-window fraction of a 24h day per method — a visual cue, not a scientific claim (the copy already frames this as adjustable). */
const EATING_FRACTIONS: Record<Method, number> = {
  '16:8': 8 / 24,
  '18:6': 6 / 24,
  '24h': 1 / 24,
  none_yet: 8 / 24,
};
const DEFAULT_FRACTION = 8 / 24;

const RING_SIZE = 128;
const STROKE = 14;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A day/night ring showing the eating window against the fasting window — the split smoothly redraws as the user picks a method, instead of a plain list. */
const FastingHeroVisual: React.FC<{ method: Method | null }> = ({ method }) => {
  const eating = useSharedValue(DEFAULT_FRACTION);

  useEffect(() => {
    eating.value = withTiming(method ? EATING_FRACTIONS[method] : DEFAULT_FRACTION, { duration: motion.duration.slow, easing: motion.easing.standard });
  }, [method, eating]);

  const eatingProps = useAnimatedProps(() => ({ strokeDasharray: `${eating.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: 0 }));
  const fastingProps = useAnimatedProps(() => ({
    strokeDasharray: `${(1 - eating.value) * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
    strokeDashoffset: -eating.value * CIRCUMFERENCE,
  }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: -8 }}>
          <AppIcon name="sunny-outline" size={18} color="rgba(255,255,255,0.55)" />
        </View>
        <View style={{ position: 'absolute', bottom: -8 }}>
          <AppIcon name="moon-outline" size={16} color="rgba(255,255,255,0.55)" />
        </View>
        <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} fill="none" />
          <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={EATING_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={eatingProps} />
          <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={FASTING_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={fastingProps} />
        </Svg>
        <AppIcon name="timer-outline" size={26} color="#FFFFFF" />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <HeroLegendDot color={EATING_COLOR} label="Eating window" />
        <HeroLegendDot color={FASTING_COLOR} label="Fasting window" />
      </View>
    </View>
  );
};

export const FastingPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={7}
      totalSteps={11}
      title="Fasting preference"
      subtitle="Sets your default fasting method — always changeable."
      onNext={() => navigation.navigate('MeditationPreferenceStep')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.fastingMethod}
    >
      <FastingHeroVisual method={draft.fastingMethod} />
      {OPTIONS.map((o) => (
        <HeroOptionCard
          key={o.key}
          title={o.label}
          description={o.desc}
          selected={draft.fastingMethod === o.key}
          accentColor={FASTING_COLOR}
          onPress={() => update({ fastingMethod: o.key })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
