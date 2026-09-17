import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

interface AmbientAudioVisualizerProps {
  playing: boolean;
  color?: string;
}

// Tallest in the middle, tapering outward — reads as a calm cluster rather
// than a flat data readout.
const BAR_BASE_HEIGHTS = [12, 20, 28, 20, 12];

/**
 * A decorative, non-data-driven visualization for the meditation player —
 * `expo-audio` exposes no waveform/FFT data to draw a real one, and a real
 * waveform would read as a music-player UI anyway (explicitly not the goal
 * here, see the design brief). Each bar breathes independently and slowly
 * while audio is playing, and settles to a still, low baseline when paused
 * or idle — same idle-vs-driven idea as `BreathingAnimation`, just ambient
 * instead of phase-driven.
 */
export const AmbientAudioVisualizer: React.FC<AmbientAudioVisualizerProps> = React.memo(({ playing, color = dashboardColors.accent }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 32, gap: 6 }}>
    {BAR_BASE_HEIGHTS.map((height, index) => (
      <Bar key={index} baseHeight={height} index={index} playing={playing} color={color} />
    ))}
  </View>
));
AmbientAudioVisualizer.displayName = 'AmbientAudioVisualizer';

const Bar: React.FC<{ baseHeight: number; index: number; playing: boolean; color: string }> = React.memo(({ baseHeight, index, playing, color }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      const duration = 1300 + index * 140;
      progress.value = withDelay(
        index * 160,
        withRepeat(withSequence(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })), -1, true)
      );
    } else {
      progress.value = withTiming(0, { duration: 400 });
    }
  }, [playing, index, progress]);

  const style = useAnimatedStyle(() => ({
    height: baseHeight * 0.45 + progress.value * baseHeight * 0.55,
    opacity: 0.4 + progress.value * 0.6,
  }));

  return <Animated.View style={[{ width: 5, borderRadius: 3, backgroundColor: color }, style]} />;
});
Bar.displayName = 'Bar';
