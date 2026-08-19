import React, { useEffect } from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { motion } from '@/theme/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GlowOrbProps {
  /** Diameter in px. */
  size: number;
  /** Center hex color of the glow (fades to transparent at the edge). */
  color: string;
  /** Peak opacity at the orb's center. */
  opacity?: number;
  style?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Slow ambient breathing pulse — off by default since many orbs on screen at once would be busy. */
  pulse?: boolean;
}

let orbId = 0;

/**
 * A soft radial-gradient glow, used as background atmosphere on hero/moment
 * screens. `expo-linear-gradient` only does linear gradients, so this uses
 * react-native-svg's RadialGradient directly to approximate a soft light
 * source rather than a flat blurred circle.
 */
export const GlowOrb: React.FC<GlowOrbProps> = ({ size, color, opacity = 0.55, style, pulse = false }) => {
  const id = React.useMemo(() => `glow-${orbId++}`, []);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (!pulse) return;
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }),
        withTiming(0.85, { duration: motion.duration.ambient, easing: motion.easing.standard })
      ),
      -1,
      true
    );
  }, [pulse, pulseValue]);

  const animatedProps = useAnimatedProps(() => ({ opacity: pulseValue.value * opacity }));

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <AnimatedCircle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} animatedProps={pulse ? animatedProps : undefined} opacity={pulse ? undefined : opacity} />
      </Svg>
    </Animated.View>
  );
};
