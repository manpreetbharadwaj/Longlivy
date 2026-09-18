import React, { useEffect } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  SharedValue,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppLogo } from '@/components/common/AppLogo';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingCtaGradient, onboardingGlass, onboardingPillarColors } from '@/features/onboarding/theme/onboardingTheme';
import { brand } from '@/config/branding';

/**
 * Three staggered soft glows expanding from the icon outward and fading as
 * they grow — "wellness energy spreading outward," not a hard-edged sonar
 * ring. Built on `GlowOrb` (the same soft radial-gradient glow used
 * elsewhere in the app — the wheel picker's center illumination, hero
 * backgrounds) rather than a new bordered-circle primitive, so this reads
 * as the same visual language, not a second glow system. Each instance
 * loops independently and continuously; the 1/3-cycle stagger between the
 * three is what makes it read as one continuous ripple rather than three
 * separate pulses.
 */
const RIPPLE_COUNT = 3;
const RIPPLE_DURATION = 3400;

const RippleRing: React.FC<{ size: number; delay: number; color: string }> = ({ size, delay, color }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: RIPPLE_DURATION, easing: Easing.out(Easing.cubic) }), -1, false));
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.18, 1], [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1.55], Extrapolation.CLAMP) }],
  }));

  return (
    // `width`/`height` here are load-bearing, not decorative: `GlowOrb`
    // itself is `position: 'absolute'`, so without an explicit size this
    // wrapper collapses to a 0×0 box — and `scale` pivots around *this*
    // view's own center, so a collapsed wrapper scales from its top-left
    // corner instead of the glow's true center, growing diagonally rather
    // than expanding outward evenly (caught on-device: the ripple visibly
    // bloomed toward the bottom-right instead of around the icon).
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <GlowOrb size={size} color={color} opacity={0.38} />
    </Animated.View>
  );
};

/**
 * The screen's single hero element — the mark itself, stable and in
 * focus, with the ripple doing all the motion behind it. Deliberately
 * *not* also breathing/rotating itself (the old version scaled the mark
 * and spun a dashed ring around it at the same time) — stacking multiple
 * independently-moving elements on the one thing that's supposed to be
 * the calm anchor is exactly what read as busy rather than premium.
 */
const RippleHero: React.FC = () => {
  const logoSize = 132;
  const rippleSize = logoSize * 1.3;
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    scale.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
  }, [opacity, scale]);

  const iconStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: rippleSize, height: rippleSize, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
        <RippleRing key={i} size={rippleSize} delay={(RIPPLE_DURATION / RIPPLE_COUNT) * i} color={onboardingAccent} />
      ))}
      <Animated.View style={iconStyle}>
        <AppLogo size={logoSize} />
      </Animated.View>
    </View>
  );
};

/**
 * One floating feature chip — a small preview of a real HealthyMe pillar
 * (icon + accent match the same pillar colors used on the bottom tab bar)
 * rather than a generic notification bubble. Unlike the previous version
 * (a Lissajous-curve drift confined to a small area around a fixed
 * anchor), this one is a genuine pinball: continuous X/Y position +
 * velocity, integrated every frame on the UI thread via
 * `useFrameCallback`, reflecting the relevant velocity component when it
 * hits a screen edge or the center exclusion zone. No React state changes
 * per frame — only shared-value mutation, read straight back out by
 * `useAnimatedStyle` on the same thread.
 */
interface PinballChipSpec {
  id: string;
  icon: AppIconName | MaterialCommunityIconName;
  family?: 'ionicons' | 'material-community';
  labelKey: TranslationKey;
  accent: string;
  /** Starting position as a fraction (0–1) of the arena's measured width/height. */
  startXFrac: number;
  startYFrac: number;
  /** Starting velocity in px/second. Signs/magnitudes below correspond to oblique ~30–60° headings (see comment on each), deliberately never axis-aligned. */
  vx0: number;
  vy0: number;
  order: number;
}

const CHIPS: PinballChipSpec[] = [
  // ~34° heading down-right, from the top-left
  { id: 'fasting', icon: 'timer-outline', labelKey: 'tabs.fasting', accent: onboardingPillarColors.fasting, startXFrac: 0.14, startYFrac: 0.12, vx0: 51, vy0: 35, order: 4 },
  // ~48° heading down-left, from the top-right
  { id: 'nutrition', icon: 'restaurant-outline', labelKey: 'tabs.nutrition', accent: onboardingPillarColors.nutrition, startXFrac: 0.82, startYFrac: 0.16, vx0: -47, vy0: 52, order: 5 },
  // ~40° heading up-right, from the bottom-left
  { id: 'meditation', icon: 'meditation', family: 'material-community', labelKey: 'tabs.meditation', accent: onboardingPillarColors.meditation, startXFrac: 0.16, startYFrac: 0.84, vx0: 44, vy0: -37, order: 6 },
  // ~55° heading up-left, from the bottom-right
  { id: 'activity', icon: 'walk-outline', labelKey: 'tabs.activity', accent: onboardingPillarColors.activity, startXFrac: 0.84, startYFrac: 0.8, vx0: -43, vy0: -61, order: 7 },
  // ~62° heading down-right, from the left edge
  { id: 'wellness', icon: 'leaf-outline', labelKey: 'onboarding.welcome.wellness', accent: '#2DD4BF', startXFrac: 0.12, startYFrac: 0.5, vx0: 31, vy0: 58, order: 8 },
];

/** Extra clearance (px) kept between a chip's edge and the measured center-content box — lets chips pass near the hero/branding/tagline without ever touching it. */
const EXCLUSION_MARGIN = 22;
/** Fallback chip box size used only for the handful of frames before its own `onLayout` reports real dimensions. */
const DEFAULT_CHIP_SIZE = { width: 112, height: 36 };

const PinballChip: React.FC<{
  spec: PinballChipSpec;
  delay: number;
  arenaWidth: SharedValue<number>;
  arenaHeight: SharedValue<number>;
  exLeft: SharedValue<number>;
  exTop: SharedValue<number>;
  exRight: SharedValue<number>;
  exBottom: SharedValue<number>;
}> = ({ spec, delay, arenaWidth, arenaHeight, exLeft, exTop, exRight, exBottom }) => {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const mountScale = useSharedValue(0.9);

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const vx = useSharedValue(spec.vx0);
  const vy = useSharedValue(spec.vy0);
  const w = useSharedValue(DEFAULT_CHIP_SIZE.width);
  const h = useSharedValue(DEFAULT_CHIP_SIZE.height);
  const initialized = useSharedValue(false);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
    mountScale.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
  }, [delay, opacity, mountScale]);

  useFrameCallback((frameInfo) => {
    const cw = arenaWidth.value;
    const ch = arenaHeight.value;
    if (cw === 0 || ch === 0) return; // arena not measured yet

    if (!initialized.value) {
      x.value = spec.startXFrac * cw - w.value / 2;
      y.value = spec.startYFrac * ch - h.value / 2;
      initialized.value = true;
    }

    // Clamp dt so a dropped/slow frame can't fling a chip across the screen in one step.
    const dt = Math.min((frameInfo.timeSincePreviousFrame ?? 16) / 1000, 0.05);

    let nx = x.value + vx.value * dt;
    let ny = y.value + vy.value * dt;
    let nvx = vx.value;
    let nvy = vy.value;

    const maxX = cw - w.value;
    const maxY = ch - h.value;
    if (nx < 0) {
      nx = 0;
      nvx = Math.abs(nvx);
    } else if (nx > maxX) {
      nx = maxX;
      nvx = -Math.abs(nvx);
    }
    if (ny < 0) {
      ny = 0;
      nvy = Math.abs(nvy);
    } else if (ny > maxY) {
      ny = maxY;
      nvy = -Math.abs(nvy);
    }

    // Bounce off the center exclusion zone (hero + branding + tagline) —
    // resolve along whichever axis is penetrating less, same AABB
    // push-out-and-reflect approach as the outer walls above.
    if (exRight.value > 0) {
      const left = nx;
      const right = nx + w.value;
      const top = ny;
      const bottom = ny + h.value;
      const overlapX = Math.min(right, exRight.value) - Math.max(left, exLeft.value);
      const overlapY = Math.min(bottom, exBottom.value) - Math.max(top, exTop.value);
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          const centerX = left + w.value / 2;
          const exCenterX = (exLeft.value + exRight.value) / 2;
          nx = centerX < exCenterX ? exLeft.value - w.value : exRight.value;
          nvx = -nvx;
        } else {
          const centerY = top + h.value / 2;
          const exCenterY = (exTop.value + exBottom.value) / 2;
          ny = centerY < exCenterY ? exTop.value - h.value : exBottom.value;
          nvy = -nvy;
        }
      }
    }

    x.value = nx;
    y.value = ny;
    vx.value = nvx;
    vy.value = nvy;
  }, true);

  const handleLayout = (e: LayoutChangeEvent) => {
    w.value = e.nativeEvent.layout.width;
    h.value = e.nativeEvent.layout.height;
  };

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: mountScale.value }],
  }));

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 6,
          paddingRight: 13,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        },
        style,
      ]}
    >
      <AppIconTile name={spec.icon} family={spec.family} color={spec.accent} size={26} iconSize={14} shape="circle" style={{ marginRight: 8 }} />
      <AppText variant="caption" color="rgba(255,255,255,0.8)" weight="600">
        {t(spec.labelKey)}
      </AppText>
    </Animated.View>
  );
};

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const arenaWidth = useSharedValue(0);
  const arenaHeight = useSharedValue(0);
  const exLeft = useSharedValue(0);
  const exTop = useSharedValue(0);
  const exRight = useSharedValue(0);
  const exBottom = useSharedValue(0);

  const handleArenaLayout = (e: LayoutChangeEvent) => {
    arenaWidth.value = e.nativeEvent.layout.width;
    arenaHeight.value = e.nativeEvent.layout.height;
  };

  // Bounding box of the hero + branding + tagline block, in arena-relative
  // coordinates (React Native's onLayout already reports a child's frame
  // relative to its immediate parent, which is exactly this arena View) —
  // padded by EXCLUSION_MARGIN so chips visibly steer clear rather than
  // brushing right up against the text.
  const handleCenterLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    exLeft.value = x - EXCLUSION_MARGIN;
    exTop.value = y - EXCLUSION_MARGIN;
    exRight.value = x + width + EXCLUSION_MARGIN;
    exBottom.value = y + height + EXCLUSION_MARGIN;
  };

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        {/* Deliberately unpadded — it's the pinball arena, and its own onLayout box must exactly match the coordinate space chips bounce inside (padding here would offset absolute children from what onLayout reports). Horizontal breathing room for the text lives on the inner block below instead. */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={handleArenaLayout}>
          {CHIPS.map((chip) => (
            <PinballChip
              key={chip.id}
              spec={chip}
              delay={motion.duration.slow + motion.staggerStepMs * chip.order}
              arenaWidth={arenaWidth}
              arenaHeight={arenaHeight}
              exLeft={exLeft}
              exTop={exTop}
              exRight={exRight}
              exBottom={exBottom}
            />
          ))}

          <View style={{ alignItems: 'center', paddingHorizontal: theme.spacing.xl }} onLayout={handleCenterLayout} pointerEvents="none">
            <FadeSlideIn delay={motion.staggerStepMs}>
              <View style={{ marginBottom: theme.spacing.lg }}>
                <RippleHero />
              </View>
            </FadeSlideIn>

            <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 2}>
              <AppText variant="displayMedium" color={onboardingGlass.textPrimary} align="center" weight="800">
                {brand.name}
              </AppText>
            </FadeSlideIn>
            <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 3}>
              <AppText variant="bodyLarge" color={onboardingGlass.textSecondary} align="center" style={{ marginTop: theme.spacing.xxs }}>
                {t('onboarding.welcome.tagline')}
              </AppText>
            </FadeSlideIn>
          </View>
        </View>

        <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 10} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label={t('onboarding.welcome.begin')} onPress={() => navigation.navigate('GoalSelect')} colors={onboardingCtaGradient} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
