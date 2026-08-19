import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const MEDITATION_COLOR = '#9B7FD9';

/** A slow, continuous breathing circle — the calmest visual in the flow, deliberately paced (~3.2s per phase) to feel like an actual breathing exercise rather than a generic pulse. */
const MeditationHeroVisual: React.FC = () => {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 3200, easing: motion.easing.standard }),
        withTiming(1, { duration: 3200, easing: motion.easing.standard })
      ),
      -1,
      false
    );
  }, [breathe]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <View style={{ alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={132} color={MEDITATION_COLOR} opacity={0.3} pulse />
        <Animated.View
          style={[
            { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: 'rgba(155,127,217,0.5)' },
            ringStyle,
          ]}
        />
        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(155,127,217,0.22)', alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name="leaf-outline" size={28} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
};

export const MeditationPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={8}
      totalSteps={11}
      title="Interested in meditation?"
      subtitle="Guided, free and breathing sessions live in their own space in the app."
      onNext={() => navigation.navigate('NotificationPreferenceStep')}
      onBack={() => navigation.goBack()}
    >
      <MeditationHeroVisual />
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <HeroOptionCard
          layout="column"
          icon="leaf"
          title="Yes, count me in"
          selected={draft.meditationInterest}
          accentColor={MEDITATION_COLOR}
          onPress={() => update({ meditationInterest: true })}
          style={{ flex: 1 }}
        />
        <HeroOptionCard
          layout="column"
          icon="time-outline"
          title="Maybe later"
          selected={!draft.meditationInterest}
          accentColor="rgba(255,255,255,0.4)"
          onPress={() => update({ meditationInterest: false })}
          style={{ flex: 1 }}
        />
      </View>
    </OnboardingStepLayout>
  );
};
