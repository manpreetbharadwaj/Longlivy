import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withDelay, withTiming, Easing, SharedValue } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { FloatingParticles } from './sceneHelpers';

const SCENE_W = 180;
const SCENE_H = 170;

// A literal box-breath rhythm (expand → hold → contract → hold) rather than
// a continuous sine wave — the "hold" beats are what make it read as
// *breathing* specifically, not just a pulsing circle, and they're also
// what makes this loop unmistakably slower/calmer than Activity's steady
// ~1.7s bob.
const EXPAND_MS = 1900;
const HOLD_MS = 750;
const CONTRACT_MS = 1900;

/** A tiny seated figure — head, torso, folded knees — built from plain rounded Views. Deliberately not literal anatomy, just enough shape to read as "a person sitting still". */
const SeatedFigure: React.FC<{ color: string; scale: SharedValue<number> }> = ({ color, scale }) => {
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (scale.value - 1) * 0.4 }] }));
  return (
    <Animated.View style={[{ alignItems: 'center' }, style]} pointerEvents="none">
      <View style={{ width: 13, height: 13, borderRadius: 6.5, backgroundColor: color, marginBottom: 2 }} />
      <View style={{ width: 22, height: 14, borderTopLeftRadius: 11, borderTopRightRadius: 11, backgroundColor: color }} />
      <View style={{ width: 34, height: 7, borderRadius: 3.5, backgroundColor: color, marginTop: -2 }} />
    </Animated.View>
  );
};

/**
 * Mind's scene: "calm + breathing + mindfulness". Two concentric rings
 * breathing on a real expand-hold-contract-hold cycle, a barely-visible
 * seated figure at the center, and a couple of very slow particles — every
 * duration here deliberately longer than Activity's so the two cards
 * contrast (energetic vs. calm) rather than just swapping colors.
 */
export const MindVisual: React.FC<{ color: string }> = ({ color }) => {
  const breathe = useSharedValue(1);
  const outerBreathe = useSharedValue(1);

  useEffect(() => {
    const cycle = () =>
      withRepeat(
        withSequence(
          withTiming(1.16, { duration: EXPAND_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.16, { duration: HOLD_MS }),
          withTiming(1, { duration: CONTRACT_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: HOLD_MS })
        ),
        -1,
        false
      );
    breathe.value = cycle();
    outerBreathe.value = withDelay(280, cycle());
  }, [breathe, outerBreathe]);

  const innerStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  const outerStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + (outerBreathe.value - 1) * 0.75 }], opacity: 0.3 }));

  return (
    <View style={{ width: SCENE_W, height: SCENE_H, alignItems: 'center', justifyContent: 'center' }}>
      <FloatingParticles color={color} width={SCENE_W} height={SCENE_H} count={4} opacity={0.28} baseDurationMs={4200} bandStart={0.05} bandEnd={0.9} />

      <Animated.View style={[{ position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: color }, outerStyle]} />
      <Animated.View
        style={[
          { width: 96, height: 96, borderRadius: 48, backgroundColor: `${color}1F`, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' },
          innerStyle,
        ]}
      >
        <SeatedFigure color={color} scale={breathe} />
      </Animated.View>

      <AppText variant="caption" color={color} weight="700" style={{ marginTop: 14, letterSpacing: 1.5 }}>
        12 MIN SESSION
      </AppText>
    </View>
  );
};
