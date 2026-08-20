import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/theme';
import { pillarGradients, PillarKey } from '@/theme/gradients';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const PILLARS: { key: PillarKey; icon: AppIconName; title: string; desc: string }[] = [
  { key: 'fasting', icon: 'timer-outline', title: 'Fasting', desc: 'Plan, track and understand your fasting rhythm — with a timeline that explains what your body is doing, not just a countdown.' },
  { key: 'nutrition', icon: 'restaurant-outline', title: 'Nutrition', desc: 'Log meals in seconds — by photo, barcode or voice — and see calories and macros in context, not isolation.' },
  { key: 'activity', icon: 'walk-outline', title: 'Activity', desc: 'Track workouts and watch how they shift your daily energy balance in real time.' },
  { key: 'meditation', icon: 'leaf-outline', title: 'Meditation', desc: 'Short or long sessions, guided or free — a calm space built into the same app.' },
];

// How much of the neighboring card peeks in at each screen edge, and the
// gap between adjacent cards — together these are what make the swipe read
// as a deck of cards rather than a plain full-bleed carousel.
const SIDE_PEEK = 20;
const CARD_GAP = 12;
const CARD_HEIGHT = 320;

const DeckCard: React.FC<{
  pillar: (typeof PILLARS)[number];
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  snapInterval: number;
  theme: Theme;
}> = ({ pillar, index, scrollX, cardWidth, snapInterval, theme }) => {
  // The active (centered) card sits at scale 1 / full opacity; cards to
  // either side ease down slightly as they're swiped toward — a subtle
  // depth cue rather than a flat filmstrip, and it's what makes the next
  // card visibly "become" the active one mid-swipe instead of popping in.
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval];
    const scale = interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.65, 1, 0.65], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[{ width: cardWidth, marginRight: CARD_GAP }, animatedStyle]}>
      <View style={{ borderRadius: theme.radius.xl, overflow: 'hidden', height: CARD_HEIGHT }}>
        <LinearGradient colors={pillarGradients[pillar.key]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: theme.spacing.xl, justifyContent: 'flex-end' }}>
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
            <AppIcon name={pillar.icon} size={30} color="#FFFFFF" />
          </View>
          <AppText variant="headingLarge" color="#FFFFFF">
            {pillar.title}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.82)" style={{ marginTop: theme.spacing.xxs }}>
            {pillar.desc}
          </AppText>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

export const WhatIsLonglivyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = width - SIDE_PEEK * 2 - CARD_GAP;
  const snapInterval = cardWidth + CARD_GAP;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  // Derives the active dot from the same scroll position driving the card
  // animation, so the indicator and the deck never disagree — only bridges
  // to JS state when the rounded index actually changes.
  useAnimatedReaction(
    () => Math.round(scrollX.value / snapInterval),
    (index, previous) => {
      if (index !== previous && index >= 0 && index < PILLARS.length) {
        runOnJS(setActiveIndex)(index);
      }
    },
    [snapInterval]
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
      <Animated.ScrollView
        horizontal
        snapToInterval={snapInterval}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -theme.spacing.md }}
        contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
      >
        {PILLARS.map((p, index) => (
          <DeckCard key={p.key} pillar={p} index={index} scrollX={scrollX} cardWidth={cardWidth} snapInterval={snapInterval} theme={theme} />
        ))}
      </Animated.ScrollView>

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
