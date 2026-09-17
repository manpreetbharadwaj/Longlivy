import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

interface MeditationParticlesProps {
  size: number;
  color?: string;
  active: boolean;
  /** 'normal' (default, all 6 — unchanged existing behavior) / 'few' (3, e.g. a Night theme's subtler field) / 'none' (renders nothing, e.g. a Focus theme or reduced motion). */
  density?: 'none' | 'few' | 'normal';
}

// Fixed, deterministic scatter (not random per render) — six soft specks
// around the visual's circumference, each on its own slow opacity cycle so
// they drift in and out of visibility asynchronously rather than pulsing in
// lockstep. Position-only (no per-frame layout math) and opacity-only
// animation (no transform) keeps this cheap even with several on screen.
const PARTICLES = [
  { top: 0.06, left: 0.5, size: 5, delay: 0, duration: 3400 },
  { top: 0.22, left: 0.86, size: 4, delay: 600, duration: 3000 },
  { top: 0.5, left: 0.96, size: 6, delay: 1200, duration: 3800 },
  { top: 0.78, left: 0.82, size: 4, delay: 300, duration: 3200 },
  { top: 0.92, left: 0.46, size: 5, delay: 900, duration: 3600 },
  { top: 0.3, left: 0.08, size: 4, delay: 1500, duration: 3000 },
];

/** A handful of slow, softly-pulsing specks around the session's central visual — decorative ambient atmosphere, not audio- or data-driven. */
export const MeditationParticles: React.FC<MeditationParticlesProps> = React.memo(({ size, color = '#FFFFFF', active, density = 'normal' }) => {
  if (density === 'none') return null;
  const visibleParticles = density === 'few' ? PARTICLES.slice(0, 3) : PARTICLES;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: size, height: size }}>
      {visibleParticles.map((particle, index) => (
        <Particle key={index} particle={particle} containerSize={size} color={color} active={active} />
      ))}
    </View>
  );
});
MeditationParticles.displayName = 'MeditationParticles';

const Particle: React.FC<{ particle: (typeof PARTICLES)[number]; containerSize: number; color: string; active: boolean }> = React.memo(
  ({ particle, containerSize, color, active }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (active) {
        opacity.value = withDelay(
          particle.delay,
          withRepeat(
            withSequence(
              withTiming(0.55, { duration: particle.duration, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.1, { duration: particle.duration, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
          )
        );
      } else {
        opacity.value = withTiming(0, { duration: 500 });
      }
    }, [active, opacity, particle.delay, particle.duration]);

    const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: particle.top * containerSize,
            left: particle.left * containerSize,
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: color,
          },
          style,
        ]}
      />
    );
  }
);
Particle.displayName = 'Particle';
