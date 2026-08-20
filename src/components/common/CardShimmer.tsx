import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface CardShimmerProps {
  /** Delay before the sweep starts, so it can land just after the card itself has finished entering. */
  delay?: number;
}

/**
 * A single soft diagonal light sweep across a card's surface — fires once
 * on mount, not a looping loading-skeleton shimmer. Meant to read as light
 * briefly passing over glass rather than a flashy effect, so it's used on
 * only a couple of the dashboard's most prominent cards, not everywhere.
 *
 * Render as the LAST child of a card whose outer container has
 * `overflow: 'hidden'` (so the sweep clips to the card's rounded corners)
 * — position is absolute and non-interactive.
 */
export const CardShimmer: React.FC<CardShimmerProps> = React.memo(({ delay = 350 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0 && progress.value < 1 ? 1 : 0,
    transform: [{ translateX: (progress.value - 0.5) * 500 }, { rotate: '20deg' }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', top: -60, bottom: -60, left: 0, width: 90 }, animatedStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
});

CardShimmer.displayName = 'CardShimmer';
