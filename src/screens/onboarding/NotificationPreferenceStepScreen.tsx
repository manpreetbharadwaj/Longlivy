import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const NOTIFICATION_COLOR = '#5FBFAE';

/** A bell that gives a one-shot "ring" wiggle + badge dot when notifications turn on, and settles still when off — responsive to the toggle rather than animating on a loop. */
const NotificationHeroVisual: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const rotate = useSharedValue(0);
  const dot = useSharedValue(enabled ? 1 : 0);

  useEffect(() => {
    if (enabled) {
      rotate.value = withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(12, { duration: 120 }),
        withTiming(-8, { duration: 120 }),
        withTiming(5, { duration: 120 }),
        withTiming(0, { duration: 120 })
      );
    }
    dot.value = withTiming(enabled ? 1 : 0, { duration: 220 });
  }, [enabled, rotate, dot]);

  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dot.value }], opacity: dot.value }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={120} color={NOTIFICATION_COLOR} opacity={enabled ? 0.4 : 0.15} pulse={enabled} />
        <Animated.View
          style={[
            {
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: 'rgba(95,191,174,0.2)',
              borderWidth: 1.5,
              borderColor: 'rgba(95,191,174,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            },
            bellStyle,
          ]}
        >
          <AppIcon name={enabled ? 'notifications' : 'notifications-outline'} size={32} color="#FFFFFF" />
        </Animated.View>
        <Animated.View
          style={[
            { position: 'absolute', top: 24, right: 24, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E06A5D', borderWidth: 2, borderColor: '#03100D' },
            dotStyle,
          ]}
        />
      </View>
    </View>
  );
};

export const NotificationPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={9}
      totalSteps={11}
      title="Stay in the loop?"
      subtitle="You can fine-tune every notification type later in Settings."
      onNext={() => navigation.navigate('CompleteSetup')}
      onBack={() => navigation.goBack()}
    >
      <NotificationHeroVisual enabled={draft.notificationsEnabled} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.14)',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF">
            Enable notifications
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.65)">
            Fasting reminders, streaks and goal updates.
          </AppText>
        </View>
        <AppSwitch variant="hero" value={draft.notificationsEnabled} onValueChange={(v) => update({ notificationsEnabled: v })} />
      </View>
    </OnboardingStepLayout>
  );
};
