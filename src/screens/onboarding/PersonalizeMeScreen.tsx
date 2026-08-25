import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { onboardingAccent, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Goal = NonNullable<OnboardingDraft['goal']>;

/** What each goal is *for*, spoken back to the user here so the goal they just chose visibly carries forward instead of vanishing into state. */
const GOAL_TAGLINE: Record<Goal, string> = {
  weight_loss: 'help you reach a steady weight-loss target',
  maintenance: 'help you hold steady, right where you are',
  muscle_gain: 'help you build, with a target that supports it',
};

const INPUTS: { icon: AppIconName; label: string }[] = [
  { icon: 'body-outline', label: 'A few body basics' },
  { icon: 'calendar-outline', label: 'Your birthday' },
  { icon: 'nutrition-outline', label: 'What nutrients to prioritize' },
];

const InputRow: React.FC<{ item: (typeof INPUTS)[number]; delay: number }> = ({ item, delay }) => {
  const { theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.duration.base, easing: motion.easing.decelerate }));
    translateX.value = withDelay(delay, withTiming(0, { duration: motion.duration.base, easing: motion.easing.decelerate }));
  }, [delay, opacity, translateX]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: translateX.value }] }));

  return (
    <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }, style]}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: `${onboardingAccent}22`,
          borderWidth: 1.5,
          borderColor: `${onboardingAccent}55`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.sm,
        }}
      >
        <AppIcon name={item.icon} size={18} color={onboardingAccent} />
      </View>
      <AppText variant="bodyMedium" color={onboardingGlass.textSecondary}>
        {item.label}
      </AppText>
    </Animated.View>
  );
};

/**
 * Step 1 of 6 — the announcement, not a question. Confirms the goal just
 * chosen is what everything downstream is built around, and previews (never
 * asks for) the handful of inputs the next five steps will collect, so the
 * user knows exactly what's coming and why. Kept deliberately light: one
 * screen, one message, one primary action.
 */
export const PersonalizeMeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft } = useOnboardingDraft();
  const tagline = draft.goal ? GOAL_TAGLINE[draft.goal] : 'help you build a plan that actually fits';

  return (
    <OnboardingStepLayout
      step={1}
      totalSteps={7}
      title="Personalize Me"
      subtitle={`A few quick things and Long Livy will ${tagline}.`}
      onNext={() => navigation.navigate('Gender')}
      onBack={() => navigation.goBack()}
      nextLabel="Let's go"
      dimBackground
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AppText variant="label" color={onboardingGlass.textTertiary} style={{ letterSpacing: 1, marginBottom: theme.spacing.md }}>
          WHAT WE'LL USE
        </AppText>
        {INPUTS.map((item, i) => (
          <InputRow key={item.label} item={item} delay={motion.staggerStepMs * (i + 2)} />
        ))}
      </View>
    </OnboardingStepLayout>
  );
};
