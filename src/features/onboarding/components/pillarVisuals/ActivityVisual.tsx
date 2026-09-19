import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { ActivityFigure } from '@/features/activity/components/ActivityFigure';
import { MotionLines } from './sceneHelpers';

const GROUND_TICKS = [0, 1, 2, 3, 4];

/** A faint horizon line with a few ticks drifting left in a seamless loop — the one "environment" cue that this figure is covering ground, not running in place. */
const GroundDrift: React.FC<{ color: string }> = ({ color }) => {
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withRepeat(withTiming(-24, { duration: 900, easing: Easing.linear }), -1, false);
  }, [shift]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <View style={{ width: 130, height: 1, marginTop: 8, overflow: 'hidden' }}>
      <Animated.View style={[{ flexDirection: 'row', width: 260 }, style]}>
        {[...GROUND_TICKS, ...GROUND_TICKS].map((_, i) => (
          <View key={i} style={{ width: 10, height: 1, marginRight: 16, backgroundColor: color, opacity: 0.22 }} />
        ))}
      </Animated.View>
    </View>
  );
};

/**
 * Activity's scene: "movement + energy + performance". `ActivityFigure`
 * already animates its own legs/arms and a footfall bounce (see that file) —
 * this adds the surrounding sense of motion: trailing lines, a drifting
 * ground line, and distance/calories that count up rather than snap in,
 * so the whole scene reads as "in progress" rather than a posed figure.
 */
export const ActivityVisual: React.FC<{ color: string }> = ({ color }) => {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withDelay(
      300,
      withRepeat(withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })), -1, false)
    );
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 4 }] }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 130, height: 112, alignItems: 'center', justifyContent: 'center' }}>
        <MotionLines color={color} cadenceMs={280} />
        <Animated.View style={bobStyle}>
          <ActivityFigure type="running" size={104} color={color} />
        </Animated.View>
      </View>

      <GroundDrift color={color} />

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 12 }}>
        <AnimatedNumberText value={6.2} startDelay={260} duration={1200} formatter={(n) => n.toFixed(1)} variant="bodySmall" weight="700" color="#FFFFFF" />
        <AppText variant="bodySmall" color="rgba(255,255,255,0.65)"> km · </AppText>
        <AnimatedNumberText value={412} startDelay={380} duration={1200} variant="bodySmall" weight="700" color="#FFFFFF" />
        <AppText variant="bodySmall" color="rgba(255,255,255,0.65)"> kcal · 48 min</AppText>
      </View>
    </View>
  );
};
