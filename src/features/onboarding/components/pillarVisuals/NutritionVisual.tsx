import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';

// Sized to fit alongside the macro bars below it within the same overall
// visual budget the other three pillars' scenes use on their own (Nutrition
// is the one pillar with a distinct "supporting detail" block underneath
// the hero visual, so the scene itself has to stay more compact).
const SCENE_W = 190;
const SCENE_H = 130;
const CENTER_X = SCENE_W / 2;
const CENTER_Y = 65;
const PLATE_SIZE = 80;
const ORBIT_RADIUS = PLATE_SIZE / 2 + 22;

const MACROS: { label: string; target: number; icon: AppIconName; angle: number }[] = [
  { label: 'Protein', target: 0.82, icon: 'egg-outline', angle: -90 },
  { label: 'Carbs', target: 0.64, icon: 'leaf-outline', angle: 30 },
  { label: 'Fats', target: 0.71, icon: 'water-outline', angle: 150 },
];

/** One food-group chip orbiting clearly outside the plate rim — a fixed angular position with its own small independent bob, rather than every chip moving in lockstep. */
const FoodChip: React.FC<{ icon: AppIconName; angle: number; color: string; delay: number }> = ({ icon, angle, color, delay }) => {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) })), -1, false)
    );
  }, [bob, delay]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 5 }] }));

  const rad = (angle * Math.PI) / 180;
  const x = CENTER_X + ORBIT_RADIUS * Math.cos(rad) - 16;
  const y = CENTER_Y + ORBIT_RADIUS * Math.sin(rad) - 16;

  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, style]}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${color}22`,
          borderWidth: 1.5,
          borderColor: `${color}66`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} size={15} color={color} />
      </View>
    </Animated.View>
  );
};

const MacroRow: React.FC<{ label: string; target: number; color: string; delay: number }> = ({ label, target, color, delay }) => {
  const progress = useAnimatedProgress(target, 1100, { delay, step: 0.01 });
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.68)">
          {label}
        </AppText>
        <AppText variant="bodySmall" weight="700" color="#FFFFFF">
          {Math.round(progress * 100)}%
        </AppText>
      </View>
      <AppProgressBar progress={progress} color={color} trackColor="rgba(255,255,255,0.1)" height={6} />
    </View>
  );
};

/**
 * Nutrition's scene: "food + balance + nutrients". A plate — two concentric
 * rim lines, no filled disc (a flat tinted circle read as a muddy blob
 * rather than a plate) — with three food-group chips (protein/carbs/fats,
 * matching the macro rows below it 1:1 so the two halves of the scene read
 * as one idea) orbiting clearly outside the rim, the whole group riding a
 * slow shared bob. Macro bars stay underneath as supporting detail — real
 * numbers, secondary to the plate itself.
 */
export const NutritionVisual: React.FC<{ color: string }> = ({ color }) => {
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })), -1, false);
  }, [bob]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 3 }] }));

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <Animated.View style={[{ width: SCENE_W, height: SCENE_H, alignItems: 'center', justifyContent: 'center' }, bobStyle]}>
        <Svg width={SCENE_W} height={SCENE_H} style={{ position: 'absolute' }}>
          {/* Two line-only rims (no fill) — reads as a plate's outer edge +
              inner well, rather than a flat tinted disc. */}
          <Circle cx={CENTER_X} cy={CENTER_Y} r={PLATE_SIZE / 2} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.55} />
          <Circle cx={CENTER_X} cy={CENTER_Y} r={PLATE_SIZE * 0.32} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
        </Svg>
        {MACROS.map((m, i) => (
          <FoodChip key={m.label} icon={m.icon} angle={m.angle} color={color} delay={i * 180} />
        ))}
      </Animated.View>

      <View style={{ width: '100%', paddingHorizontal: 14, marginTop: 2 }}>
        {MACROS.map((m, i) => (
          <MacroRow key={m.label} label={m.label} target={m.target} color={color} delay={220 + i * 150} />
        ))}
      </View>
    </View>
  );
};
