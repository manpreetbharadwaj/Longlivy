import React, { useCallback, useRef, useState } from 'react';
import { View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { pillarGradients, PillarKey } from '@/theme/gradients';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const PILLARS: { key: PillarKey; icon: AppIconName; title: string; desc: string }[] = [
  { key: 'fasting', icon: 'timer-outline', title: 'Fasting', desc: 'Plan, track and understand your fasting rhythm — with a timeline that explains what your body is doing, not just a countdown.' },
  { key: 'nutrition', icon: 'restaurant-outline', title: 'Nutrition', desc: 'Log meals in seconds — by photo, barcode or voice — and see calories and macros in context, not isolation.' },
  { key: 'activity', icon: 'walk-outline', title: 'Activity', desc: 'Track workouts and watch how they shift your daily energy balance in real time.' },
  { key: 'meditation', icon: 'leaf-outline', title: 'Meditation', desc: 'Short or long sessions, guided or free — a calm space built into the same app.' },
];

export const WhatIsLonglivyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const slideWidth = width - theme.spacing.md * 2;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
      if (index !== activeIndex) setActiveIndex(index);
    },
    [activeIndex, slideWidth]
  );

  return (
    <OnboardingStepLayout
      variant="hero"
      step={1}
      totalSteps={11}
      title="What is Longlivy?"
      subtitle="Four connected areas, one daily picture. Swipe to explore."
      onNext={() => navigation.navigate('TrackingOverview')}
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={slideWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={{ marginHorizontal: -theme.spacing.md }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      >
        {PILLARS.map((p) => (
          <View key={p.key} style={{ width: slideWidth, paddingRight: 0 }}>
            <View style={{ borderRadius: theme.radius.xl, overflow: 'hidden', height: 320 }}>
              <LinearGradient colors={pillarGradients[p.key]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: theme.spacing.xl, justifyContent: 'flex-end' }}>
                <GlowOrb size={220} color="#FFFFFF" opacity={0.12} style={{ top: -60, right: -60 }} />
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  <AppIcon name={p.icon} size={30} color="#FFFFFF" />
                </View>
                <AppText variant="headingLarge" color="#FFFFFF">
                  {p.title}
                </AppText>
                <AppText variant="bodyMedium" color="rgba(255,255,255,0.82)" style={{ marginTop: theme.spacing.xxs }}>
                  {p.desc}
                </AppText>
              </LinearGradient>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.md }}>
        {PILLARS.map((p, i) => (
          <View
            key={p.key}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              marginHorizontal: 3,
              backgroundColor: i === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </View>
    </OnboardingStepLayout>
  );
};
