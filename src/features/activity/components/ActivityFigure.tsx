import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing, SharedValue } from 'react-native-reanimated';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { ActivityType } from '@/features/activity/models';

interface ActivityFigureProps {
  type: ActivityType;
  size?: number;
  color?: string;
}

/**
 * A tiny animated mini-illustration per activity type — a minimalist
 * "figure" built from plain Views + Reanimated transforms (no SVG/Lottie
 * needed) rather than a swapped icon glyph, so Running/Cycling/Hiking each
 * visibly communicate their own motion. Deliberately built as one
 * configurable component keyed by ActivityType (with a graceful fallback
 * for types that don't have a bespoke figure yet) rather than three
 * hardcoded one-off components, so adding e.g. "swimming" later is a
 * matter of adding one entry to BIPED_PARAMS or a new render branch, not
 * restructuring the callers.
 */
export const ActivityFigure: React.FC<ActivityFigureProps> = React.memo(({ type, size = 48, color = '#6AA3DE' }) => {
  if (type === 'cycling') return <CyclingFigure size={size} color={color} />;

  const params = BIPED_PARAMS[type];
  if (params) return <BipedFigure size={size} color={color} {...params} />;

  return <FallbackFigure size={size} color={color} />;
});
ActivityFigure.displayName = 'ActivityFigure';

interface BipedParams {
  /** Degrees each leg swings to either side of rest. */
  legAmplitude: number;
  /** Degrees each arm swings to either side of rest (counter-phase to the legs, like a natural gait). */
  armAmplitude: number;
  /** Half-cycle duration — smaller is a brisker cadence. */
  cadenceMs: number;
  /** Static forward lean on the whole figure, degrees. */
  lean: number;
  /** Whether to draw a small backpack accessory (hiking). */
  backpack?: boolean;
}

const BIPED_PARAMS: Partial<Record<ActivityType, BipedParams>> = {
  running: { legAmplitude: 32, armAmplitude: 24, cadenceMs: 260, lean: 6 },
  jogging: { legAmplitude: 24, armAmplitude: 18, cadenceMs: 340, lean: 3 },
  walking: { legAmplitude: 16, armAmplitude: 11, cadenceMs: 460, lean: 0 },
  hiking: { legAmplitude: 15, armAmplitude: 10, cadenceMs: 500, lean: 2, backpack: true },
};

/** Drives a limb's swing angle: settles to rest, then loops ±amplitude, optionally phase-delayed so left/right limbs alternate. */
function useSwing(amplitude: number, cadenceMs: number, phaseDelay = 0): SharedValue<number> {
  const angle = useSharedValue(0);
  useEffect(() => {
    angle.value = withDelay(
      phaseDelay,
      withRepeat(
        withSequence(
          withTiming(amplitude, { duration: cadenceMs, easing: Easing.inOut(Easing.sin) }),
          withTiming(-amplitude, { duration: cadenceMs, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [amplitude, cadenceMs, phaseDelay, angle]);
  return angle;
}

/** A limb (arm or leg) that swings around a fixed joint — the "hinge box" is centered on the joint so rotating the box rotates the visible capsule around that point rather than its own midpoint. */
const Limb: React.FC<{ jointX: number; jointY: number; length: number; width: number; color: string; angle: SharedValue<number>; baseDeg?: number }> = ({
  jointX,
  jointY,
  length,
  width,
  color,
  angle,
  baseDeg = 0,
}) => {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${baseDeg + angle.value}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: jointX - width / 2, top: jointY - length, width, height: length * 2 }, style]}>
      <View style={{ position: 'absolute', top: length, left: 0, width, height: length, borderRadius: width / 2, backgroundColor: color }} />
    </Animated.View>
  );
};

const BipedFigure: React.FC<{ size: number; color: string } & BipedParams> = ({ size, color, legAmplitude, armAmplitude, cadenceMs, lean, backpack }) => {
  const headD = size * 0.22;
  const torsoLen = size * 0.3;
  const torsoW = size * 0.09;
  const legLen = size * 0.32;
  const legW = size * 0.075;
  const armLen = size * 0.24;
  const armW = size * 0.06;
  const limbOffset = size * 0.09;

  const centerX = size / 2;
  const headTop = size * 0.04;
  const shoulderY = headTop + headD;
  const hipY = shoulderY + torsoLen;

  const legL = useSwing(legAmplitude, cadenceMs, 0);
  const legR = useSwing(legAmplitude, cadenceMs, cadenceMs);
  const armL = useSwing(armAmplitude, cadenceMs, cadenceMs); // counter-phase to the same-side leg
  const armR = useSwing(armAmplitude, cadenceMs, 0);

  // A small vertical bob synced to the gait — bounces twice per full stride, like a real footfall.
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(withSequence(withTiming(1, { duration: cadenceMs, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: cadenceMs, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, [cadenceMs, bounce]);
  const bounceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bounce.value * size * 0.02 }, { rotate: `${lean}deg` }] }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size, height: size }, bounceStyle]}>
        <Limb jointX={centerX - limbOffset} jointY={hipY} length={legLen} width={legW} color={color} angle={legL} />
        <Limb jointX={centerX + limbOffset} jointY={hipY} length={legLen} width={legW} color={color} angle={legR} />
        {backpack ? (
          <View
            style={{
              position: 'absolute',
              left: centerX - torsoW * 1.6,
              top: shoulderY + torsoLen * 0.15,
              width: torsoW * 1.2,
              height: torsoLen * 0.6,
              borderRadius: torsoW * 0.5,
              backgroundColor: `${color}55`,
            }}
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            left: centerX - torsoW / 2,
            top: shoulderY,
            width: torsoW,
            height: torsoLen,
            borderRadius: torsoW / 2,
            backgroundColor: color,
          }}
        />
        <Limb jointX={centerX - limbOffset} jointY={shoulderY + size * 0.02} length={armLen} width={armW} color={color} angle={armL} />
        <Limb jointX={centerX + limbOffset} jointY={shoulderY + size * 0.02} length={armLen} width={armW} color={color} angle={armR} />
        <View
          style={{
            position: 'absolute',
            left: centerX - headD / 2,
            top: headTop,
            width: headD,
            height: headD,
            borderRadius: headD / 2,
            backgroundColor: color,
          }}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Two spinning wheels + a simple leaning rider — kept deliberately spare
 * (no thin frame/seat lines, which just turned to visual noise at
 * icon-scale) since the wheels alone already read unambiguously as
 * "cycling"; the rider's silhouette and small pumping legs reinforce it
 * without needing literal frame geometry.
 */
const CyclingFigure: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const wheelD = size * 0.32;
  const wheelY = size - wheelD - size * 0.06;
  const rearX = size * 0.06;
  const frontX = size - wheelD - size * 0.06;
  const pedalX = size * 0.46;
  const pedalY = wheelY + wheelD * 0.35;

  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false);
  }, [spin]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  const legL = useSwing(12, 300, 0);
  const legR = useSwing(12, 300, 300);

  const Wheel: React.FC<{ x: number }> = ({ x }) => (
    <View style={{ position: 'absolute', left: x, top: wheelY, width: wheelD, height: wheelD, borderRadius: wheelD / 2, borderWidth: 2, borderColor: color }}>
      <Animated.View style={[{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }, spinStyle]}>
        <View style={{ position: 'absolute', width: '80%', height: 2, borderRadius: 1, backgroundColor: color }} />
        <View style={{ position: 'absolute', width: 2, height: '80%', borderRadius: 1, backgroundColor: color }} />
      </Animated.View>
    </View>
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Wheel x={rearX} />
      <Wheel x={frontX} />
      <Limb jointX={pedalX} jointY={pedalY} length={size * 0.15} width={size * 0.065} color={color} angle={legL} baseDeg={20} />
      <Limb jointX={pedalX + size * 0.035} jointY={pedalY} length={size * 0.15} width={size * 0.065} color={color} angle={legR} baseDeg={20} />
      {/* Leaning torso */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.42,
          top: size * 0.18,
          width: size * 0.09,
          height: size * 0.3,
          borderRadius: size * 0.045,
          backgroundColor: color,
          transform: [{ rotate: '-30deg' }],
        }}
      />
      {/* Head */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.6,
          top: size * 0.06,
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: size * 0.1,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

/** For activity types without a bespoke figure yet — a gently pulsing icon glyph instead of a static/dead one, so new types (swimming, gym, yoga, ...) still feel alive without needing a custom illustration up front. */
const FALLBACK_ICONS: Partial<Record<ActivityType, AppIconName>> = { other: 'barbell-outline' };

const FallbackFigure: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.08 }] }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={style}>
        <AppIcon name={FALLBACK_ICONS.other ?? 'fitness-outline'} size={size * 0.5} color={color} />
      </Animated.View>
    </View>
  );
};
