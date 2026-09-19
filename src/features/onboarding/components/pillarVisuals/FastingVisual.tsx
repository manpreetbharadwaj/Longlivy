import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { ClockSweep, MiniSilhouette, FloatingParticles } from './sceneHelpers';

const RING_SIZE = 138;
const SCENE_W = 200;
const SCENE_H = 210;

/**
 * Fasting's scene: "time + body + progress". The ring itself (already the
 * real dashboard component, not a bespoke illustration) does the heavy
 * lifting; everything layered around it is a quiet ambient detail —
 * a slow clock-hand sweep, a barely-there body silhouette, a few particles
 * reading as rising energy — none of it competing with the ring's own
 * fill animation for attention.
 */
export const FastingVisual: React.FC<{ color: string }> = ({ color }) => {
  const progress = useAnimatedProgress(0.7, 1400, { delay: 260 });

  // A near-imperceptible outer breathing scale on the whole ring — separate
  // from the fill animation, so the ring still feels "alive" once the fill
  // has settled rather than going static.
  const idle = useSharedValue(1);
  useEffect(() => {
    idle.value = withRepeat(withSequence(withTiming(1.015, { duration: 2600, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, [idle]);
  const idleStyle = useAnimatedStyle(() => ({ transform: [{ scale: idle.value }] }));

  return (
    <View style={{ width: SCENE_W, height: SCENE_H, alignItems: 'center', justifyContent: 'center' }}>
      <FloatingParticles color={color} width={SCENE_W} height={SCENE_H} count={3} opacity={0.35} baseDurationMs={2800} bandStart={0.05} bandEnd={0.55} />

      <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <ClockSweep color={color} size={RING_SIZE} handLength={RING_SIZE * 0.32} revolutionMs={16000} />
        <Animated.View style={idleStyle}>
          <AppProgressRing progress={progress} size={RING_SIZE} strokeWidth={10} color={color} trackColor="rgba(255,255,255,0.1)" glow>
            <AppText variant="headingLarge" weight="800" color="#FFFFFF">
              16h 42m
            </AppText>
          </AppProgressRing>
        </Animated.View>
      </View>

      <View style={{ marginTop: 4 }}>
        <MiniSilhouette color={color} height={26} opacity={0.28} />
      </View>

      <AppText variant="caption" color={color} weight="700" style={{ marginTop: 10, letterSpacing: 1.5 }}>
        FASTED
      </AppText>
    </View>
  );
};
