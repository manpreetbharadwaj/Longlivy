import React, { useCallback, useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { useAppDispatch } from '@/store/hooks';
import { completeOnboardingThunk } from '@/features/auth/authSlice';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile, setCalorieGoal } from '@/features/calories/calorieSlice';
import { CalorieCalculationEngine } from '@/features/calories/services/CalorieCalculationEngine';
import { heroGradient } from '@/theme/gradients';
import { motion } from '@/theme/motion';

const engine = new CalorieCalculationEngine();

/** A one-time checkmark "arrival" — the bookend to Welcome's breathing mark. A single confirming overshoot (0 -> 1.15 -> 1) rather than a bounce loop, since this fires once and should read as a completion, not ambient motion. */
const CompleteHeroVisual: React.FC = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.duration.fast });
    scale.value = withDelay(
      80,
      withSequence(withTiming(1.15, { duration: 340, easing: motion.easing.decelerate }), withTiming(1, { duration: 220, easing: motion.easing.standard }))
    );
  }, [opacity, scale]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={132} color="#4FB77E" opacity={0.4} pulse />
        <Animated.View
          style={[
            { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(79,183,126,0.22)', borderWidth: 1.5, borderColor: 'rgba(79,183,126,0.6)', alignItems: 'center', justifyContent: 'center' },
            markStyle,
          ]}
        >
          <AppIcon name="checkmark" size={40} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    }}
  >
    <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)">
      {label}
    </AppText>
    <AppText variant="bodyMedium" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
      {value}
    </AppText>
  </View>
);

export const CompleteSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { draft } = useOnboardingDraft();
  const dispatch = useAppDispatch();

  const finish = useCallback(() => {
    const heightCm = Number(draft.heightCm) || 176;
    const weightKg = Number(draft.weightKg) || 75;
    const age = draft.dateOfBirth ? Math.max(1, Math.floor((Date.now() - new Date(draft.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))) : 30;
    const gender = draft.gender ?? 'diverse';
    const activityLevel = draft.activityLevel ?? 'moderate';

    dispatch(
      updateProfile({
        firstName: draft.firstName || 'Alex',
        lastName: draft.lastName || 'Rivera',
        dateOfBirth: draft.dateOfBirth || '1992-04-18',
        gender,
        heightCm,
        weightKg,
        activityLevel,
        goal: draft.goal ?? 'general_wellness',
      })
    );
    dispatch(setBodyProfile({ age, gender, heightCm, weightKg, activityLevel }));
    const nrla = engine.calculateNrla({ age, gender, heightCm, weightKg, activityLevel });
    dispatch(setCalorieGoal(engine.calculateCalorieGoal(nrla, draft.goal ?? 'general_wellness')));
    dispatch(completeOnboardingThunk());
  }, [dispatch, draft]);

  return (
    <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={heroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={380} color="#4FB77E" opacity={0.28} style={{ top: -120, left: -100 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.md }}>
          <CompleteHeroVisual />
          <FadeSlideIn>
            <AppText variant="displayMedium" align="center" color="#FFFFFF" style={{ marginBottom: theme.spacing.md }}>
              You're all set
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 2}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.14)',
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
              }}
            >
              <SummaryRow label="Goal" value={draft.goal?.replace('_', ' ') ?? '—'} />
              <SummaryRow label="Activity level" value={draft.activityLevel?.replace('_', ' ') ?? '—'} />
              <SummaryRow label="Fasting method" value={draft.fastingMethod ?? '—'} />
              <SummaryRow label="Meditation" value={draft.meditationInterest ? 'Interested' : 'Skip for now'} />
              <SummaryRow label="Notifications" value={draft.notificationsEnabled ? 'Enabled' : 'Disabled'} last />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={motion.staggerStepMs * 4}>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.md }}>
              Your calorie and macro goals were calculated from this — you can adjust everything anytime.
            </AppText>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.staggerStepMs * 6} style={{ padding: theme.spacing.md }}>
          <AppGradientButton label="Enter Longlivy" onPress={finish} colors={['#4FB77E', '#0B4F4A']} />
        </FadeSlideIn>
      </SafeAreaView>
    </View>
  );
};
