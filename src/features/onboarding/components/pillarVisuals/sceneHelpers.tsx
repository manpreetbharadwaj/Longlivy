import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withDelay, withTiming, Easing } from 'react-native-reanimated';

/**
 * Small motion helpers shared across the four onboarding pillar "scenes"
 * (see `../PillarVisual.tsx`) — kept here instead of duplicated per-pillar
 * so the ambient particle/ground-motion language stays consistent across
 * cards rather than each one inventing its own drift math.
 */

/** Deterministic per-index pseudo-random in [0,1) — same value every render/remount so a particle field doesn't visibly "reshuffle" when a card re-enters the top of the deck. */
function seeded(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface FloatingParticlesProps {
  color: string;
  count?: number;
  width: number;
  height: number;
  /** Peak opacity each particle reaches mid-drift — kept low; these are atmosphere, not content. */
  opacity?: number;
  /** Roughly how long one full fade-in/drift-out cycle takes, ms. Vary this per pillar so Fasting's "rising energy" reads faster than Mind's "calm float". */
  baseDurationMs?: number;
  /** Vertical band (0..1 of `height`) particles are seeded within, so they sit near the visual instead of anywhere in its box. */
  bandStart?: number;
  bandEnd?: number;
}

/**
 * A handful of small dots drifting slowly upward and fading in/out on
 * independent, staggered loops — the one "ambient particle" language reused
 * across Fasting (rising energy) and Mind (calm atmosphere), and sparingly
 * on Nutrition. Pure Reanimated UI-thread transforms, no state, no re-renders.
 */
export const FloatingParticles: React.FC<FloatingParticlesProps> = React.memo(
  ({ color, count = 4, width, height, opacity = 0.4, baseDurationMs = 3000, bandStart = 0.1, bandEnd = 0.75 }) => {
    const particles = useMemo(
      () =>
        Array.from({ length: count }, (_, i) => ({
          size: 3 + seeded(i * 13.1 + width) * 3,
          left: 6 + seeded(i * 7.7 + width) * Math.max(width - 12, 1),
          top: height * bandStart + seeded(i * 3.3 + height) * height * (bandEnd - bandStart),
          driftPx: 10 + seeded(i * 5.5) * 12,
          durationMs: baseDurationMs + seeded(i * 9.9) * 1000,
          delayMs: seeded(i * 2.2) * 900,
        })),
      [count, width, height, baseDurationMs, bandStart, bandEnd]
    );

    return (
      <View style={{ position: 'absolute', width, height }} pointerEvents="none">
        {particles.map((p, i) => (
          <Particle key={i} {...p} color={color} peakOpacity={opacity} />
        ))}
      </View>
    );
  }
);
FloatingParticles.displayName = 'FloatingParticles';

const Particle: React.FC<{
  size: number;
  left: number;
  top: number;
  driftPx: number;
  durationMs: number;
  delayMs: number;
  color: string;
  peakOpacity: number;
}> = ({ size, left, top, driftPx, durationMs, delayMs, color, peakOpacity }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(withTiming(1, { duration: durationMs, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: durationMs, easing: Easing.inOut(Easing.sin) })),
        -1,
        false
      )
    );
  }, [progress, delayMs, durationMs]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * peakOpacity,
    transform: [{ translateY: -progress.value * driftPx }],
  }));

  return <Animated.View style={[{ position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
};

/**
 * A thin hand sweeping slowly around a center point — the "time passing"
 * detail on the Fasting scene. Rotates the whole `size`-square wrapper
 * (not the hand itself) so the hand, offset toward the top of that square,
 * pivots around the wrapper's center — the same hinge technique
 * `ActivityFigure`'s `Limb` uses for limbs pivoting at a joint.
 */
export const ClockSweep: React.FC<{ color: string; size: number; handLength: number; revolutionMs?: number }> = ({
  color,
  size,
  handLength,
  revolutionMs = 15000,
}) => {
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withRepeat(withTiming(360, { duration: revolutionMs, easing: Easing.linear }), -1, false);
  }, [angle, revolutionMs]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, alignItems: 'center' }, style]}>
      <View style={{ width: 1.5, height: handLength, marginTop: size / 2 - handLength, backgroundColor: color, opacity: 0.45, borderRadius: 1 }} />
    </Animated.View>
  );
};

/**
 * A very small, deliberately abstract standing figure — head + shoulders
 * only, no limbs — used as a quiet "this is about your body" watermark
 * beneath the Fasting ring. Breathes almost imperceptibly; it's atmosphere,
 * not a second focal point.
 */
export const MiniSilhouette: React.FC<{ color: string; height?: number; opacity?: number }> = ({ color, height = 30, opacity = 0.3 }) => {
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(withSequence(withTiming(1.05, { duration: 3400, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, [breathe]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  const headD = height * 0.34;

  return (
    <Animated.View style={[{ alignItems: 'center', opacity }, style]} pointerEvents="none">
      <View style={{ width: headD, height: headD, borderRadius: headD / 2, backgroundColor: color, marginBottom: 2 }} />
      <View style={{ width: height * 0.62, height: height * 0.5, borderTopLeftRadius: height * 0.31, borderTopRightRadius: height * 0.31, backgroundColor: color }} />
    </Animated.View>
  );
};

/**
 * Three short trailing strokes that pulse in/out on a staggered loop just
 * behind a moving figure — implies speed without literal cartoon "speed
 * lines" (kept thin, low-opacity, and few in number).
 */
export const MotionLines: React.FC<{ color: string; cadenceMs?: number }> = ({ color, cadenceMs = 300 }) => {
  return (
    <View style={{ position: 'absolute', left: -2, top: '38%', flexDirection: 'column' }} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <MotionLine key={i} color={color} delayMs={i * cadenceMs} cadenceMs={cadenceMs} length={14 - i * 3} offsetY={i * 9} />
      ))}
    </View>
  );
};

const MotionLine: React.FC<{ color: string; delayMs: number; cadenceMs: number; length: number; offsetY: number }> = ({ color, delayMs, cadenceMs, length, offsetY }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(withSequence(withTiming(1, { duration: cadenceMs * 2.2, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: cadenceMs * 1.3, easing: Easing.in(Easing.cubic) })), -1, false)
    );
  }, [progress, delayMs, cadenceMs]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value * 0.4,
    transform: [{ translateX: -progress.value * 8 }],
  }));

  return <Animated.View style={[{ position: 'absolute', top: offsetY, width: length, height: 1.5, borderRadius: 1, backgroundColor: color }, style]} />;
};
