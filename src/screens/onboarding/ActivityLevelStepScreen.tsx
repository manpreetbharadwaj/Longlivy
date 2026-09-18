import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { useGoalFlow } from '@/features/onboarding/goals/useGoalFlow';
import { navigateToFlowStep } from '@/features/onboarding/goals/flow';
import { motion } from '@/theme/motion';
import { onboardingAccent } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Level = NonNullable<OnboardingDraft['activityLevel']>;

// Internal keys stay aligned with BodyProfile/CalorieCalculationEngine's
// existing enum so the activity-multiplier logic downstream is untouched.
// Label + description are resolved at render via `t('enums.activityLevel.*')`
// and `t('onboarding.activityLevel.options.*')`.
const LEVEL_KEYS: Level[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

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
  const selectedIndex = level ? LEVEL_KEYS.indexOf(level) : -1;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', height: BAR_MIN + 4 * BAR_STEP + 8, marginBottom: 8 }}>
      {LEVEL_KEYS.map((key, i) => (
        <EnergyBar key={key} index={i} active={i <= selectedIndex} />
      ))}
    </View>
  );
};

export const ActivityLevelStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();
  const { flow, totalSteps } = useGoalFlow();

  return (
    <OnboardingStepLayout
      step={6}
      totalSteps={totalSteps}
      title={t('onboarding.activityLevel.title')}
      subtitle={t('onboarding.activityLevel.subtitle')}
      onNext={() => navigateToFlowStep(navigation, flow[0])}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.activityLevel}
    >
      <ActivityHeroVisual level={draft.activityLevel} />
      {LEVEL_KEYS.map((key) => (
        <HeroOptionCard
          key={key}
          title={t(`enums.activityLevel.${key}`)}
          description={t(`onboarding.activityLevel.options.${key}.desc`)}
          selected={draft.activityLevel === key}
          accentColor={onboardingAccent}
          onPress={() => update({ activityLevel: key })}
          style={{ marginBottom: theme.spacing.sm }}
        />
      ))}
    </OnboardingStepLayout>
  );
};
