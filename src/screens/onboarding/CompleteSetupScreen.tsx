import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { HeroLegendDot } from '@/components/common/HeroLegendDot';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, ageToDateOfBirth } from '@/features/onboarding/OnboardingContext';
import { useAppDispatch } from '@/store/hooks';
import { completeOnboardingThunk } from '@/features/auth/authSlice';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile, setCalorieGoal } from '@/features/calories/calorieSlice';
import { CalorieCalculationEngine } from '@/features/calories/services/CalorieCalculationEngine';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingData, onboardingCtaGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

const engine = new CalorieCalculationEngine();

const GOAL_LABELS: Record<string, string> = { weight_loss: 'Lose weight', maintenance: 'Maintain weight', muscle_gain: 'Gain weight' };
const ACTIVITY_LABELS: Record<string, string> = { sedentary: 'Sedentary', light: 'Lightly active', moderate: 'Moderately active', active: 'Very active', very_active: 'Extremely active' };

const STATUSES = ['Analyzing your profile…', 'Calculating your baseline…', 'Personalizing your plan…'];
const STATUS_STEP_MS = 650;

/** Concentric scanning rings during the calibration beat — a shorter, busier cousin of Welcome's SignalMark, since this one has ~2s to say "working", not to be admired. */
const CalibratingVisual: React.FC = () => {
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 500, easing: motion.easing.standard }), withTiming(1, { duration: 500, easing: motion.easing.standard })), -1, false);
  }, [rotate, pulse]);

  const rotateStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderTopColor: onboardingAccent, borderRightColor: onboardingData, borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
          rotateStyle,
        ]}
      />
      <Animated.View style={[{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${onboardingAccent}2E` }, pulseStyle]} />
    </View>
  );
};

/** A one-time confirming overshoot (0 → 1.15 → 1) for the summary's arrival — fires once, reads as completion rather than ambient motion. */
const ArrivalCheck: React.FC = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.duration.fast });
    scale.value = withDelay(80, withSequence(withTiming(1.15, { duration: 340, easing: motion.easing.decelerate }), withTiming(1, { duration: 220, easing: motion.easing.standard })));
  }, [opacity, scale]);

  const markStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        { width: 64, height: 64, borderRadius: 32, backgroundColor: `${onboardingData}29`, borderWidth: 1.5, borderColor: onboardingData, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
        markStyle,
      ]}
    >
      <AppIcon name="checkmark" size={28} color="#FFFFFF" />
    </Animated.View>
  );
};

const RING_SIZE = 108;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
// A balanced 40/30/30 split — an illustrative starting point shown as an
// output of onboarding, not a question asked during it. Fully adjustable
// later in Nutrition Goals.
const MACRO_SPLIT = { carb: 0.4, protein: 0.3, fat: 0.3 };
const CARB_COLOR = '#5B9BD5';
const PROTEIN_COLOR = '#E0AC55';
const FAT_COLOR = onboardingAccent;

/** Nutrition-baseline ring, drawn in once the summary reveals. */
const NutritionBaselineRing: React.FC = () => {
  const carb = useSharedValue(0);
  const protein = useSharedValue(0);
  const fat = useSharedValue(0);

  useEffect(() => {
    carb.value = withDelay(200, withTiming(MACRO_SPLIT.carb, { duration: motion.duration.slow, easing: motion.easing.standard }));
    protein.value = withDelay(200, withTiming(MACRO_SPLIT.protein, { duration: motion.duration.slow, easing: motion.easing.standard }));
    fat.value = withDelay(200, withTiming(MACRO_SPLIT.fat, { duration: motion.duration.slow, easing: motion.easing.standard }));
  }, [carb, protein, fat]);

  const carbProps = useAnimatedProps(() => ({ strokeDasharray: `${carb.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: 0 }));
  const proteinProps = useAnimatedProps(() => ({ strokeDasharray: `${protein.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: -carb.value * CIRCUMFERENCE }));
  const fatProps = useAnimatedProps(() => ({ strokeDasharray: `${fat.value * CIRCUMFERENCE} ${CIRCUMFERENCE}`, strokeDashoffset: -(carb.value + protein.value) * CIRCUMFERENCE }));

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={CARB_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={carbProps} />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={PROTEIN_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={proteinProps} />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={FAT_COLOR} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={fatProps} />
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <HeroLegendDot color={CARB_COLOR} label="Carbs" />
        <HeroLegendDot color={PROTEIN_COLOR} label="Protein" />
        <HeroLegendDot color={FAT_COLOR} label="Fat" />
      </View>
    </View>
  );
};

const StatRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
    <AppText variant="bodyMedium" color={onboardingGlass.textSecondary}>
      {label}
    </AppText>
    <AppText variant="bodyMedium" color={onboardingGlass.textPrimary}>
      {value}
    </AppText>
  </View>
);

/**
 * The bridge from "answering questions" to "using the app" — a short,
 * purposeful calibration beat (~1.9s of cycling status text) followed by a
 * personalized summary that assembles itself: profile recap, calorie
 * target counting up, activity/goal, and a nutrition-baseline preview. The
 * app visibly configuring itself for the user, not a bare "Done!".
 */
export const CompleteSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { draft } = useOnboardingDraft();
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState<'calibrating' | 'summary'>('calibrating');
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStatusIndex((i) => Math.min(i + 1, STATUSES.length - 1)), STATUS_STEP_MS);
    const timeout = setTimeout(() => setPhase('summary'), STATUS_STEP_MS * STATUSES.length + 250);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const age = draft.age ?? 27;
  const gender = draft.gender ?? 'diverse';
  const heightCm = draft.heightCm ?? 170;
  const weightKg = draft.weightKg ?? 70;
  const activityLevel = draft.activityLevel ?? 'moderate';
  const goal = draft.goal ?? 'maintenance';
  const pace = draft.weightChangePaceKgPerWeek;
  const nrla = engine.calculateNrla({ age, gender, heightCm, weightKg, activityLevel });
  const calorieGoal = engine.calculateCalorieGoal(nrla, goal, pace);

  const finish = useCallback(() => {
    const dateOfBirth = draft.dateOfBirth ?? ageToDateOfBirth(age);
    dispatch(
      updateProfile({
        dateOfBirth,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        goal,
        trainingFrequency: draft.trainingFrequency ?? undefined,
        trainingVolume: draft.trainingVolume ?? undefined,
        weightChangePaceKgPerWeek: pace ?? undefined,
        fastingMethod: draft.fastingMethod ?? undefined,
      })
    );
    dispatch(setBodyProfile({ age, gender, heightCm, weightKg, activityLevel }));
    const bmr = engine.calculateBmr({ age, gender, heightCm, weightKg, activityLevel });
    const finalNrla = engine.calculateNrla({ age, gender, heightCm, weightKg, activityLevel });
    dispatch(
      setCalorieGoal({
        calories: engine.calculateCalorieGoal(finalNrla, goal, pace),
        source: 'auto',
        calculationMethod: bmr.method,
        calculationVersion: bmr.version,
      })
    );
    dispatch(completeOnboardingThunk());
  }, [dispatch, age, gender, heightCm, weightKg, activityLevel, goal, pace, draft.dateOfBirth, draft.trainingFrequency, draft.trainingVolume, draft.fastingMethod]);

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        {phase === 'calibrating' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
            <View style={{ marginBottom: theme.spacing.lg }}>
              <CalibratingVisual />
            </View>
            <AppText variant="headingMedium" color={onboardingGlass.textPrimary} align="center">
              {STATUSES[statusIndex]}
            </AppText>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.md }} showsVerticalScrollIndicator={false}>
            <FadeSlideIn>
              <View style={{ alignItems: 'center' }}>
                <ArrivalCheck />
                <AppText variant="displayMedium" align="center" color={onboardingGlass.textPrimary} style={{ marginBottom: 4 }}>
                  Your plan is ready
                </AppText>
                <AppText variant="bodyMedium" align="center" color={onboardingGlass.textSecondary} style={{ marginBottom: theme.spacing.lg, maxWidth: 280 }}>
                  Built from your profile — every number below adjusts as you go.
                </AppText>
              </View>
            </FadeSlideIn>

            <FadeSlideIn delay={motion.staggerStepMs * 2}>
              <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
                <AnimatedNumberText value={calorieGoal} variant="metricHero" color={onboardingGlass.textPrimary} formatter={(n) => `${Math.round(n)}`} />
                <AppText variant="label" color={onboardingData} style={{ letterSpacing: 1, marginTop: 2 }}>
                  DAILY CALORIE TARGET
                </AppText>
              </View>
            </FadeSlideIn>

            <FadeSlideIn delay={motion.staggerStepMs * 3}>
              <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
                <NutritionBaselineRing />
              </View>
            </FadeSlideIn>

            <FadeSlideIn delay={motion.staggerStepMs * 4}>
              <View style={{ backgroundColor: onboardingGlass.fill, borderWidth: 1.5, borderColor: onboardingGlass.border, borderRadius: theme.radius.lg, padding: theme.spacing.md }}>
                <StatRow label="Goal" value={GOAL_LABELS[goal]} />
                <StatRow label="Activity level" value={ACTIVITY_LABELS[activityLevel]} />
                <StatRow label="Height · Weight" value={`${heightCm} cm · ${weightKg} kg`} last />
              </View>
            </FadeSlideIn>
          </ScrollView>
        )}

        {phase === 'summary' ? (
          <FadeSlideIn delay={motion.staggerStepMs * 6} style={{ padding: theme.spacing.md }}>
            <AppGradientButton label="Enter Longlivy" onPress={finish} colors={onboardingCtaGradient} />
          </FadeSlideIn>
        ) : null}
      </SafeAreaView>
    </OnboardingBackground>
  );
};
