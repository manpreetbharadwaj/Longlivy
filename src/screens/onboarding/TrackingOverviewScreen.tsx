import React, { useEffect } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedStyle, withDelay, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { pillarGradients, PillarKey } from '@/theme/gradients';
import { motion } from '@/theme/motion';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const CANVAS = 300;
const CENTER = { x: CANVAS / 2, y: CANVAS / 2 };
const NODE_SIZE = 56;
const CENTER_NODE_SIZE = 68;

const PILLARS: { key: PillarKey; icon: AppIconName; label: string; pos: { x: number; y: number } }[] = [
  { key: 'fasting', icon: 'timer-outline', label: 'Fasting', pos: { x: 36, y: 36 } },
  { key: 'nutrition', icon: 'restaurant-outline', label: 'Nutrition', pos: { x: CANVAS - 36, y: 36 } },
  { key: 'activity', icon: 'walk-outline', label: 'Activity', pos: { x: 36, y: CANVAS - 36 } },
  { key: 'meditation', icon: 'leaf-outline', label: 'Meditation', pos: { x: CANVAS - 36, y: CANVAS - 36 } },
];

/** One connecting line + traveling pulse dot from a pillar node to the center. */
const ConnectionLine: React.FC<{ from: { x: number; y: number }; index: number }> = ({ from, index }) => {
  const length = Math.hypot(CENTER.x - from.x, CENTER.y - from.y);
  const draw = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    draw.value = withDelay(index * 180, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
    pulse.value = withDelay(
      motion.duration.slow + index * 180 + 400,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, false)
    );
  }, [draw, index, pulse]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * length,
  }));

  const dotStyle = useAnimatedStyle(() => {
    const t = pulse.value;
    return {
      opacity: draw.value * (t < 0.85 ? 1 : (1 - t) / 0.15),
      transform: [
        { translateX: from.x + (CENTER.x - from.x) * t - 3 },
        { translateY: from.y + (CENTER.y - from.y) * t - 3 },
      ],
    };
  });

  return (
    <>
      <AnimatedLine
        x1={from.x}
        y1={from.y}
        x2={CENTER.x}
        y2={CENTER.y}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={2}
        strokeDasharray={length}
        animatedProps={lineProps}
      />
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }, dotStyle]} />
    </>
  );
};

export const TrackingOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  return (
    <OnboardingStepLayout
      variant="hero"
      step={2}
      totalSteps={11}
      title="Data that connects itself"
      subtitle="Longlivy links what you track — not just stores it."
      onNext={() => navigation.navigate('ChooseGoal')}
      onBack={() => navigation.goBack()}
    >
      <View style={{ alignItems: 'center', marginTop: theme.spacing.sm }}>
        <View style={{ width: CANVAS, height: CANVAS }}>
          <Svg width={CANVAS} height={CANVAS} style={{ position: 'absolute' }}>
            {PILLARS.map((p, i) => (
              <ConnectionLine key={p.key} from={p.pos} index={i} />
            ))}
          </Svg>

          {PILLARS.map((p) => (
            <View
              key={p.key}
              style={{
                position: 'absolute',
                left: p.pos.x - NODE_SIZE / 2,
                top: p.pos.y - NODE_SIZE / 2,
                width: NODE_SIZE,
                height: NODE_SIZE,
                borderRadius: NODE_SIZE / 2,
                overflow: 'hidden',
              }}
            >
              <LinearGradient colors={pillarGradients[p.key]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name={p.icon} size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
          ))}

          <View
            style={{
              position: 'absolute',
              left: CENTER.x - CENTER_NODE_SIZE / 2,
              top: CENTER.y - CENTER_NODE_SIZE / 2,
              width: CENTER_NODE_SIZE,
              height: CENTER_NODE_SIZE,
              borderRadius: CENTER_NODE_SIZE / 2,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.4)',
            }}
          >
            <LinearGradient colors={['#1FA391', '#0B4F4A']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="headingLarge" color="#FFFFFF" weight="800">
                L
              </AppText>
            </LinearGradient>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: theme.spacing.sm }}>
          {PILLARS.map((p) => (
            <AppText key={p.key} variant="caption" color="rgba(255,255,255,0.55)" style={{ marginHorizontal: theme.spacing.xs }}>
              {p.label}
            </AppText>
          ))}
        </View>
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          padding: theme.spacing.md,
          marginTop: theme.spacing.lg,
        }}
      >
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.85)">
          Fasting → activity → energy expenditure → diet → calorie intake → nutritional values → daily
          balance → progress → history → personal evaluation.
        </AppText>
      </View>
      <AppText variant="bodySmall" color="rgba(255,255,255,0.55)" style={{ marginTop: theme.spacing.sm }}>
        You stay in control — Longlivy never overwrites or deletes an entry automatically. Estimated
        values are always labeled as estimates.
      </AppText>
    </OnboardingStepLayout>
  );
};
