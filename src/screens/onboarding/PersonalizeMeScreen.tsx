import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { motion } from '@/theme/motion';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { onboardingNeutral, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type Goal = NonNullable<OnboardingDraft['goal']>;

const INPUTS: { icon: AppIconName; labelKey: TranslationKey }[] = [
  { icon: 'body-outline', labelKey: 'onboarding.personalize.items.body' },
  { icon: 'calendar-outline', labelKey: 'onboarding.personalize.items.birthday' },
  { icon: 'nutrition-outline', labelKey: 'onboarding.personalize.items.nutrients' },
];

/**
 * A quiet profile "hero" for the one step in onboarding that's actually
 * about the person, not a metric — a soft breathing ring around a person
 * glyph, the same breathing-ring language used on Welcome's wordmark and
 * Meditation's pillar visual, so the motion vocabulary stays consistent
 * rather than each screen inventing its own idle animation.
 */
const ProfileMark: React.FC = () => {
  const mountProgress = useSharedValue(0);
  const breathe = useSharedValue(1);

  useEffect(() => {
    mountProgress.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    breathe.value = withDelay(
      motion.duration.slow,
      withRepeat(withSequence(withTiming(1.12, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) })), -1, false)
    );
  }, [mountProgress, breathe]);

  const markStyle = useAnimatedStyle(() => ({ opacity: mountProgress.value, transform: [{ scale: 0.9 + mountProgress.value * 0.1 }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: mountProgress.value * 0.5, transform: [{ scale: breathe.value }] }));

  return (
    <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: onboardingNeutral }, ringStyle]} />
      <Animated.View
        style={[
          { width: 72, height: 72, borderRadius: 36, backgroundColor: `${onboardingNeutral}22`, borderWidth: 1.5, borderColor: `${onboardingNeutral}66`, alignItems: 'center', justifyContent: 'center' },
          markStyle,
        ]}
      >
        <AppIcon name="person-outline" size={30} color={onboardingGlass.textPrimary} />
      </Animated.View>
    </View>
  );
};

const InputRow: React.FC<{ item: (typeof INPUTS)[number]; delay: number }> = ({ item, delay }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <FadeSlideIn delay={delay} fromX={-10} fromY={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: theme.radius.md,
            backgroundColor: `${onboardingNeutral}1F`,
            borderWidth: 1.5,
            borderColor: `${onboardingNeutral}4D`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.sm,
          }}
        >
          <AppIcon name={item.icon} size={19} color={onboardingNeutral} />
        </View>
        <AppText variant="bodyMedium" color={onboardingGlass.textSecondary} style={{ flex: 1 }}>
          {t(item.labelKey)}
        </AppText>
      </View>
    </FadeSlideIn>
  );
};

/**
 * Step 1 of 7 — the announcement, not a question. Confirms the goal just
 * chosen is what everything downstream is built around, and previews (never
 * asks for) the handful of inputs the next five steps will collect, so the
 * user knows exactly what's coming and why. Kept deliberately light: one
 * screen, one message, one primary action.
 */
export const PersonalizeMeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft } = useOnboardingDraft();
  const tagline = draft.goal ? t(`onboarding.personalize.taglines.${draft.goal}`) : t('onboarding.personalize.taglineFallback');

  return (
    <OnboardingStepLayout
      step={1}
      totalSteps={7}
      title={t('onboarding.personalize.title')}
      subtitle={t('onboarding.personalize.subtitle', { tagline })}
      onNext={() => navigation.navigate('Gender')}
      onBack={() => navigation.goBack()}
      nextLabel={t('onboarding.personalize.next')}
      dimBackground
    >
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <FadeSlideIn delay={motion.staggerStepMs} fromScale={0.9} style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
          <ProfileMark />
        </FadeSlideIn>

        <View
          style={{
            borderRadius: theme.radius.xl,
            borderWidth: 1.5,
            borderColor: onboardingGlass.border,
            backgroundColor: onboardingGlass.fill,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <AppText variant="label" color={onboardingGlass.textTertiary} style={{ letterSpacing: 1, marginTop: theme.spacing.sm }}>
            {t('onboarding.personalize.whatWeUse').toUpperCase()}
          </AppText>
          {INPUTS.map((item, i) => (
            <InputRow key={item.labelKey} item={item} delay={motion.staggerStepMs * (i + 3)} />
          ))}
        </View>
      </View>
    </OnboardingStepLayout>
  );
};
