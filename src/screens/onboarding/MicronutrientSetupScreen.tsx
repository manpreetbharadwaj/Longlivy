import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { MICRONUTRIENTS, MICRONUTRIENT_CATEGORIES, recommendMicronutrients } from '@/features/onboarding/data/micronutrients';
import { MicronutrientChip } from '@/features/onboarding/components/MicronutrientChip';
import { onboardingAccent, onboardingData, onboardingGlass, onboardingPillarColors } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const RING_SIZE = 96;
const STROKE = 9;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CATEGORY_COLOR: Record<string, string> = {
  vitamins: onboardingData,
  minerals: onboardingAccent,
  other: onboardingPillarColors.nutrition,
};

/** A single ring that fills toward "all tracked" as more nutrients are selected — the daily-target-style visual the client asked for, doubling as a live selection count. */
const CoverageRing: React.FC<{ selected: number; total: number }> = ({ selected, total }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(total > 0 ? selected / total : 0, { duration: motion.duration.base, easing: motion.easing.standard });
  }, [selected, total, progress]);

  const animatedProps = useAnimatedProps(() => ({ strokeDasharray: `${progress.value * CIRCUMFERENCE} ${CIRCUMFERENCE}` }));

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={onboardingAccent} strokeWidth={STROKE} strokeLinecap="round" fill="none" animatedProps={animatedProps} />
      </Svg>
      <AppText variant="headingLarge" color={onboardingGlass.textPrimary}>
        {selected}
      </AppText>
    </View>
  );
};

/**
 * Step 6 of 6 — the new screen the client asked for, explicitly not a
 * label/input form: a coverage ring plus grouped, tappable nutrient chips,
 * pre-selected by `recommendMicronutrients` from the goal and gender already
 * captured (so it opens already personalized, not blank) and freely
 * adjustable from there. The recommendation runs exactly once — re-entering
 * this step via back navigation never overwrites what the user actually
 * chose (see `draft.micronutrients`'s null-vs-[] distinction).
 */
export const MicronutrientSetupScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();

  useEffect(() => {
    if (draft.micronutrients === null) {
      update({ micronutrients: recommendMicronutrients(draft.goal, draft.gender) });
    }
    // Intentionally run only once, on mount — not on every `draft.goal`/
    // `draft.gender` change, which would silently overwrite a user's own
    // edits after they've already left and returned to this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIds = draft.micronutrients ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (id: string) => {
    const next = selectedSet.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    update({ micronutrients: next });
  };

  return (
    <OnboardingStepLayout
      step={7}
      totalSteps={7}
      title={t('onboarding.micronutrients.title')}
      subtitle={t('onboarding.micronutrients.subtitle')}
      onNext={() => navigation.navigate('CompleteSetup')}
      onBack={() => navigation.goBack()}
      nextLabel={t('onboarding.micronutrients.next')}
      dimBackground
    >
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <CoverageRing selected={selectedIds.length} total={MICRONUTRIENTS.length} />
        <AppText variant="caption" color={onboardingGlass.textTertiary} style={{ marginTop: theme.spacing.xs }}>
          {t('onboarding.micronutrients.trackedOf', { count: MICRONUTRIENTS.length })}
        </AppText>
      </View>

      {MICRONUTRIENT_CATEGORIES.map((cat) => (
        <View key={cat.key} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="label" color={onboardingGlass.textTertiary} style={{ letterSpacing: 1, marginBottom: theme.spacing.xs }}>
            {t(`onboarding.micronutrients.categories.${cat.key}`).toUpperCase()}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {MICRONUTRIENTS.filter((n) => n.category === cat.key).map((n) => (
              <MicronutrientChip
                key={n.id}
                label={n.label}
                blurb={n.blurb}
                selected={selectedSet.has(n.id)}
                accentColor={CATEGORY_COLOR[cat.key]}
                onPress={() => toggle(n.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </OnboardingStepLayout>
  );
};
