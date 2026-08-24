import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Ellipse, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { GlowOrb } from '@/components/common/GlowOrb';
import { motion } from '@/theme/motion';
import { onboardingAccent, onboardingData } from '../theme/onboardingTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Gender = 'female' | 'male' | 'diverse';

interface BodyParams {
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  legTop: number;
  ankle: number;
  headR: number;
}

// Half-widths in a 100-wide viewBox — an abstract, deliberately non-literal
// silhouette (no face, no skin texture) so gender/age/weight differences
// read as gentle proportion cues rather than a judgment on any real body.
const PRESETS: Record<Gender, BodyParams> = {
  female: { shoulder: 14.5, chest: 13, waist: 7.5, hip: 13, legTop: 5.8, ankle: 3.4, headR: 13 },
  male: { shoulder: 17, chest: 16, waist: 12, hip: 11, legTop: 6.6, ankle: 4, headR: 13.5 },
  diverse: { shoulder: 15.8, chest: 14.5, waist: 9.5, hip: 12, legTop: 6.1, ankle: 3.7, headR: 13.2 },
};

/** Half the gap between the two legs' centerlines — always leaves a real visible gap regardless of `legTop`, unlike a plain fraction of `legTop` (which can make the legs overlap when `legTop` is wide relative to the gap). */
function legOffset(p: BodyParams): number {
  return p.legTop + 2;
}

const Y_SHOULDER = 46;
const Y_CHEST = 68;
const Y_WAIST = 106;
const Y_HIP = 130;
const Y_CALF = 172;
const Y_ANKLE = 212;
const Y_FOOT = 221;
const CX = 50;

/** A smooth vertical curve through 3+ points — control points share the endpoint's x (vertical tangents), which reads as an organic flowing side without hand-tuning bezier handles per point. */
function smoothThrough(points: { x: number; y: number }[]): string {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midY = (p0.y + p1.y) / 2;
    d += `C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y} `;
  }
  return d;
}

function buildTorsoPath(p: BodyParams): string {
  const left = [
    { x: CX - p.shoulder, y: Y_SHOULDER },
    { x: CX - p.chest, y: Y_CHEST },
    { x: CX - p.waist, y: Y_WAIST },
    { x: CX - p.hip, y: Y_HIP },
  ];
  const right = [
    { x: CX + p.hip, y: Y_HIP },
    { x: CX + p.waist, y: Y_WAIST },
    { x: CX + p.chest, y: Y_CHEST },
    { x: CX + p.shoulder, y: Y_SHOULDER },
  ];
  let d = `M ${left[0].x} ${left[0].y} `;
  d += smoothThrough(left);
  d += `L ${right[0].x} ${right[0].y} `;
  d += smoothThrough(right);
  d += 'Z';
  return d;
}

function buildLegPath(p: BodyParams, dx: number): string {
  const cx = CX + dx;
  const top = [
    { x: cx - p.legTop, y: Y_HIP - 4 },
    { x: cx - p.legTop * 0.82, y: Y_CALF },
    { x: cx - p.ankle, y: Y_ANKLE },
    { x: cx - p.ankle * 1.3, y: Y_FOOT },
  ];
  const bottom = [
    { x: cx + p.ankle * 1.3, y: Y_FOOT },
    { x: cx + p.ankle, y: Y_ANKLE },
    { x: cx + p.legTop * 0.82, y: Y_CALF },
    { x: cx + p.legTop, y: Y_HIP - 4 },
  ];
  let d = `M ${top[0].x} ${top[0].y} `;
  d += smoothThrough(top);
  d += `L ${bottom[0].x} ${bottom[0].y} `;
  d += smoothThrough(bottom);
  d += 'Z';
  return d;
}

interface DigitalProfileFigureProps {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  /** Draws faint horizontal measurement ticks beside the figure — used only on the Height step. */
  showHeightTicks?: boolean;
  width?: number;
  height?: number;
}

const BASE_W = 220;
const BASE_H = 300;

/**
 * The shared "building your profile" visual used across Gender/Age/Height/
 * Weight — a single abstract, glowing silhouette (not literal photoreal
 * 3D — see the component-level note in the PR/summary) that responds live
 * to every input collected so far:
 *
 *  - gender  → cross-fades between three silhouette proportions
 *  - height  → scales the whole figure vertically
 *  - weight  → scales the whole figure horizontally (modest, respectful range)
 *  - age     → a very subtle secondary height/posture easing, layered on
 *              top of the height scale rather than a separate effect
 *
 * All driven by transform (scaleX/scaleY) + opacity animations on the UI
 * thread — no per-frame path morphing — so dragging the ruler pickers stays
 * smooth.
 */
export const DigitalProfileFigure: React.FC<DigitalProfileFigureProps> = ({
  gender,
  age,
  heightCm,
  weightKg,
  showHeightTicks,
  width = BASE_W,
  height = BASE_H,
}) => {
  const femaleOpacity = useSharedValue(gender === 'female' ? 1 : 0);
  const maleOpacity = useSharedValue(gender === 'male' ? 1 : 0);
  const diverseOpacity = useSharedValue(gender === 'diverse' ? 1 : 0);

  useEffect(() => {
    femaleOpacity.value = withTiming(gender === 'female' ? 1 : 0, { duration: motion.duration.slow });
    maleOpacity.value = withTiming(gender === 'male' ? 1 : 0, { duration: motion.duration.slow });
    diverseOpacity.value = withTiming(gender === 'diverse' ? 1 : 0, { duration: motion.duration.slow });
  }, [gender, femaleOpacity, maleOpacity, diverseOpacity]);

  const heightScale = useSharedValue(1);
  const widthScale = useSharedValue(1);
  const breathe = useSharedValue(1);

  useEffect(() => {
    // A gentle, real (not exaggerated) height curve: full stature by early
    // adulthood, a very slight, gradual softening past ~60 — never more
    // than a few percent either way.
    const ageFactor = age < 20 ? 0.93 + (age - 13) * 0.01 : age > 60 ? 1 - (age - 60) * 0.0015 : 1;
    const hFraction = (heightCm - 150) / (195 - 150); // 0 at 150cm, 1 at 195cm
    const target = (0.84 + hFraction * 0.32) * Math.max(0.9, Math.min(1, ageFactor));
    heightScale.value = withSpring(target, { damping: 18, stiffness: 120 });
  }, [heightCm, age, heightScale]);

  useEffect(() => {
    const wFraction = (weightKg - 45) / (110 - 45); // 0 at 45kg, 1 at 110kg
    const clamped = Math.max(0, Math.min(1.15, wFraction));
    const target = 0.88 + clamped * 0.3;
    widthScale.value = withSpring(target, { damping: 18, stiffness: 120 });
  }, [weightKg, widthScale]);

  useEffect(() => {
    breathe.value = withRepeat(withSequence(withTiming(1.015, { duration: 2400, easing: motion.easing.standard }), withTiming(1, { duration: 2400, easing: motion.easing.standard })), -1, false);
  }, [breathe]);

  const figureStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: heightScale.value * breathe.value }, { scaleX: widthScale.value }],
  }));

  const female = PRESETS.female;
  const male = PRESETS.male;
  const diverse = PRESETS.diverse;
  const femaleLegGap = legOffset(female);
  const maleLegGap = legOffset(male);
  const diverseLegGap = legOffset(diverse);

  const femaleAnimatedProps = useAnimatedProps(() => ({ opacity: femaleOpacity.value }));
  const maleAnimatedProps = useAnimatedProps(() => ({ opacity: maleOpacity.value }));
  const diverseAnimatedProps = useAnimatedProps(() => ({ opacity: diverseOpacity.value }));

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}>
      <GlowOrb size={width * 0.9} color={onboardingAccent} opacity={0.16} style={{ bottom: height * 0.08 }} />
      <GlowOrb size={width * 0.6} color={onboardingData} opacity={0.1} style={{ bottom: height * 0.35, right: -width * 0.1 }} />

      {showHeightTicks ? (
        <Svg width={28} height={height * 0.72} style={{ position: 'absolute', left: 4, bottom: height * 0.16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Line key={i} x1={4} y1={(i * (height * 0.72)) / 4} x2={i % 2 === 0 ? 20 : 12} y2={(i * (height * 0.72)) / 4} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
          ))}
        </Svg>
      ) : null}

      <Animated.View style={[{ width: BASE_W * 0.5, height: BASE_H * 0.9 }, figureStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 240">
          <Defs>
            <SvgLinearGradient id="figureFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={onboardingData} stopOpacity={0.95} />
              <Stop offset="1" stopColor={onboardingAccent} stopOpacity={0.85} />
            </SvgLinearGradient>
            <RadialGradient id="floorGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={onboardingAccent} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={onboardingAccent} stopOpacity={0} />
            </RadialGradient>
          </Defs>

          <Ellipse cx={50} cy={228} rx={34} ry={7} fill="url(#floorGlow)" />

          {/* Female */}
          <AnimatedPath animatedProps={femaleAnimatedProps} d={buildTorsoPath(female)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={femaleAnimatedProps} d={buildLegPath(female, -femaleLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={femaleAnimatedProps} d={buildLegPath(female, femaleLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={femaleAnimatedProps} d={`M ${50 - female.headR} 24 A ${female.headR} ${female.headR} 0 1 0 ${50 + female.headR} 24 A ${female.headR} ${female.headR} 0 1 0 ${50 - female.headR} 24 Z`} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />

          {/* Male */}
          <AnimatedPath animatedProps={maleAnimatedProps} d={buildTorsoPath(male)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={maleAnimatedProps} d={buildLegPath(male, -maleLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={maleAnimatedProps} d={buildLegPath(male, maleLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={maleAnimatedProps} d={`M ${50 - male.headR} 24 A ${male.headR} ${male.headR} 0 1 0 ${50 + male.headR} 24 A ${male.headR} ${male.headR} 0 1 0 ${50 - male.headR} 24 Z`} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />

          {/* Diverse */}
          <AnimatedPath animatedProps={diverseAnimatedProps} d={buildTorsoPath(diverse)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={diverseAnimatedProps} d={buildLegPath(diverse, -diverseLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={diverseAnimatedProps} d={buildLegPath(diverse, diverseLegGap)} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
          <AnimatedPath animatedProps={diverseAnimatedProps} d={`M ${50 - diverse.headR} 24 A ${diverse.headR} ${diverse.headR} 0 1 0 ${50 + diverse.headR} 24 A ${diverse.headR} ${diverse.headR} 0 1 0 ${50 - diverse.headR} 24 Z`} fill="url(#figureFill)" stroke={onboardingData} strokeWidth={0.6} />
        </Svg>
      </Animated.View>
    </View>
  );
};
