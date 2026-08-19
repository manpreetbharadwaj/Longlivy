import React, { useEffect } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { heroGradient } from '@/theme/gradients';
import { motion } from '@/theme/motion';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  // Slow breathing ring around the mark — foreshadows the calm/meditation
  // pillar and reads as "alive" rather than a static logo lockup.
  const ringScale = useSharedValue(1);
  const markScale = useSharedValue(0.85);
  const markOpacity = useSharedValue(0);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    markScale.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    ringScale.value = withDelay(
      motion.duration.slow,
      withRepeat(withSequence(withTiming(1.18, { duration: 1800, easing: Easing.out(Easing.sin) }), withTiming(1, { duration: 1800, easing: Easing.in(Easing.sin) })), -1, false)
    );
  }, [markOpacity, markScale, ringScale]);

  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value, transform: [{ scale: markScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value * 0.5, transform: [{ scale: ringScale.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={heroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={420} color="#1FA391" opacity={0.35} pulse style={{ top: -140, right: -120 }} />
      <GlowOrb size={320} color="#9B7FD9" opacity={0.18} style={{ bottom: 40, left: -140 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
          <View style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl }}>
            <Animated.View
              style={[
                { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1.5, borderColor: 'rgba(95, 191, 174, 0.55)' },
                ringStyle,
              ]}
            />
            <Animated.View
              style={[
                {
                  width: 92,
                  height: 92,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                },
                markStyle,
              ]}
            >
              <LinearGradient colors={['#1FA391', '#0B4F4A']} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="displayMedium" color="#FFFFFF" weight="800">
                  L
                </AppText>
              </LinearGradient>
            </Animated.View>
          </View>

          <FadeSlideIn delay={motion.duration.slow}>
            <AppText variant="displayLarge" color="#FFFFFF" align="center">
              Welcome to Longlivy
            </AppText>
          </FadeSlideIn>
          <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 3}>
            <AppText variant="bodyLarge" color="rgba(255,255,255,0.72)" align="center" style={{ marginTop: theme.spacing.sm, maxWidth: 320 }}>
              One place to understand your fasting, nutrition, activity and mind — connected, not scattered.
            </AppText>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 6} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label="Get started" onPress={() => navigation.navigate('WhatIsLonglivy')} />
        </FadeSlideIn>
      </SafeAreaView>
    </View>
  );
};
