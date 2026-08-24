import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppSwitch } from '@/components/common/AppSwitch';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { FASTING_METHODS, FastingMethodId, LONGER_FASTING_THRESHOLD_HOURS } from '@/features/fasting/models';
import { MethodCard } from '@/features/fasting/components/MethodCard';
import { SafetyNotice } from '@/features/fasting/components/SafetyNotice';
import { onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const CATEGORY_SEGMENTS = [
  { key: 'intermittent', label: 'Intermittent' },
  { key: 'longer', label: 'Longer' },
  { key: 'individual', label: 'Individual' },
];

/**
 * The last of the personalization steps, feeding into "Build my plan".
 * Captures a *preference* for later — not an active fast (that's
 * `startFastThunk`, reached from the Fasting tab) and not a full recurring
 * plan (specific start/end times, weekdays, timezone, notifications —
 * `CreateFastingPlan`, also reached later, once the user is actually ready
 * to schedule something rather than still creating their account).
 *
 * Reuses the same MethodCard/SafetyNotice/FASTING_METHODS catalog as
 * SelectFastingMethodScreen so a 24h+ choice reads identically wherever it
 * appears. The safety notice alone isn't a confirmation gate on that
 * existing screen; here — per the requirement that a disclaimer must be
 * shown "before it's confirmed" for a longer method — picking one directly
 * from the disclaimer moment "beforehand" enables an explicit
 * acknowledgment toggle that must be turned on before Continue does.
 */
export const FastingPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();
  const [category, setCategory] = useState<'intermittent' | 'longer' | 'individual'>('intermittent');
  const [acknowledged, setAcknowledged] = useState(false);

  const methods = useMemo(() => FASTING_METHODS.filter((m) => m.category === category), [category]);
  const selected = FASTING_METHODS.find((m) => m.id === draft.fastingMethod);
  const needsAcknowledgment = !!selected && selected.fastingHours >= LONGER_FASTING_THRESHOLD_HOURS;

  const selectMethod = (id: FastingMethodId) => {
    update({ fastingMethod: draft.fastingMethod === id ? null : id });
    setAcknowledged(false);
  };

  return (
    <OnboardingStepLayout
      step={9}
      totalSteps={9}
      title="How do you want to fast?"
      subtitle="A starting preference — change it anytime from the Fasting tab."
      onNext={() => navigation.navigate('CompleteSetup')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.fastingMethod || (needsAcknowledgment && !acknowledged)}
      nextLabel="Build my plan"
      dimBackground
    >
      <View style={{ marginBottom: theme.spacing.md }}>
        <AppSegmentedControl segments={CATEGORY_SEGMENTS} selectedKey={category} onChange={(k) => setCategory(k as typeof category)} variant="hero" />
      </View>

      {category === 'longer' ? (
        <FadeSlideIn delay={0}>
          <View style={{ marginBottom: theme.spacing.sm }}>
            <SafetyNotice />
          </View>
        </FadeSlideIn>
      ) : null}

      {methods.map((method, index) => (
        <FadeSlideIn key={method.id} delay={motion.staggerStepMs * (index + 1)} fromY={10}>
          <MethodCard method={method} selected={draft.fastingMethod === method.id} onPress={() => selectMethod(method.id)} />
        </FadeSlideIn>
      ))}

      {needsAcknowledgment ? (
        <FadeSlideIn delay={0} fromY={12}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: onboardingGlass.fill,
              borderWidth: 1.5,
              borderColor: onboardingGlass.border,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.sm,
              marginTop: theme.spacing.xs,
            }}
          >
            <AppSwitch value={acknowledged} onValueChange={setAcknowledged} variant="hero" accessibilityLabel="I understand the safety notice" />
            <AppText variant="bodySmall" color={onboardingGlass.textSecondary} style={{ flex: 1, marginLeft: theme.spacing.sm }}>
              I understand and want to proceed with {selected?.name}.
            </AppText>
          </View>
        </FadeSlideIn>
      ) : null}
    </OnboardingStepLayout>
  );
};
