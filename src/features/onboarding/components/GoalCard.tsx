import React, { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { onboardingGlass } from '../theme/onboardingTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * One continuous, fully **opaque** card fill for every state. It's a single
 * flat colour on the visible surface — no translucent wash for the page's
 * gradient/glow to show through (which read as a "hollow"/transparent inner
 * rectangle), and no second stacked surface layer behind it. When a card is
 * selected its fill blends the goal's own `accent` into the same warm-dark
 * base, so "Gain weight" reads as a continuously brown/gold-toned card
 * rather than a coloured frame around an empty middle.
 */
const CARD_FILL = '#201C15'; // == onboardingPanelGradient[1]
const CARD_SELECTED_MIX = 0.18;

/** Linear blend of two `#rrggbb` colours → an opaque `#rrggbb`. */
function blendHex(base: string, over: string, amount: number): string {
  const b = parseInt(base.slice(1), 16);
  const o = parseInt(over.slice(1), 16);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount);
  const r = mix((b >> 16) & 255, (o >> 16) & 255);
  const g = mix((b >> 8) & 255, (o >> 8) & 255);
  const bl = mix(b & 255, o & 255);
  return `#${(0x1000000 | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/** Illustrative trend shapes — a visual cue for "the outcome this goal points toward", not a data chart. */
const SPARK_PATHS: Record<string, string> = {
  weight_loss: 'M2 6 C 16 8, 24 14, 34 16 S 52 24, 62 26',
  maintenance: 'M2 16 C 14 10, 22 22, 34 16 S 50 10, 62 16',
  muscle_gain: 'M2 26 C 16 22, 24 18, 34 12 S 52 6, 62 4',
};
/**
 * Each path's actual rendered length (measured, not guessed — see git history
 * for the numeric-integration script used to compute these), plus a couple of
 * px of margin. This used to be one shared, deliberately-oversized constant
 * (90, against paths that only measure ~63); `strokeDashoffset` doesn't start
 * revealing anything until it drops below the *real* path length, so that
 * slack sat there as a silent ~30% of the animation's duration doing nothing
 * visible, then drew the whole line in the remaining time — reading as a
 * pause followed by a sudden "appears all at once" reveal rather than one
 * smooth point-to-point draw across the full duration.
 */
const SPARK_LENGTHS: Record<string, number> = { weight_loss: 65, maintenance: 64, muscle_gain: 66 };
/** How long one full left-to-right draw of the right-side `Sparkline` takes. */
const TREND_DRAW_MS = 1000;
/** How long the fully-drawn line stays put before it resets and redraws. */
const TREND_HOLD_MS = 900;
/** Duration of each of the two masking fades around the reset — see `useLoopingStrokeDraw`. Quick on purpose: it's there to hide an instant snap, not to be its own noticeable beat. */
const TREND_RESET_FADE_MS = 250;

/**
 * Drives one continuously-repeating "draw -> hold -> reset -> redraw" stroke
 * cycle for the right-side `Sparkline` (the only animated element on the
 * card). The reset back to hidden is an instantaneous (0ms) snap of `draw`
 * from 1 back to 0 — jumping straight
 * from "fully drawn" to "fully hidden" would be a visible pop on its own,
 * so it only ever happens at the exact instant `opacity` has faded to 0, and
 * `opacity` doesn't start fading back in until *after* that snap. The result
 * is the viewer only ever sees the completed line gently fade away and a
 * blank canvas fade back in — never a jump, an "un-drawing" line, or the
 * next cycle starting already drawn.
 */
function useLoopingStrokeDraw(delay: number, length: number) {
  const draw = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Mount-in fade first, then the infinite cycle — kept as one continuous
    // assignment (rather than two separate `.value =` calls) since the
    // second would otherwise cancel the first before it ever ran.
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }),
        withRepeat(
          withSequence(
            withTiming(1, { duration: TREND_DRAW_MS + TREND_HOLD_MS }),
            withTiming(0, { duration: TREND_RESET_FADE_MS, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: TREND_RESET_FADE_MS, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      )
    );
    // Starts its own repeat once the mount-in fade above has finished (same
    // `delay + motion.duration.slow` point), so the very first draw begins
    // from full opacity exactly like every one after it.
    draw.value = withDelay(
      delay + motion.duration.slow,
      withRepeat(
        withSequence(
          withTiming(1, { duration: TREND_DRAW_MS, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: TREND_HOLD_MS + TREND_RESET_FADE_MS }),
          withTiming(0, { duration: 0 }),
          withTiming(0, { duration: TREND_RESET_FADE_MS })
        ),
        -1,
        false
      )
    );
  }, [draw, opacity, delay]);

  return useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * length,
    opacity: opacity.value,
  }));
}

const Sparkline: React.FC<{ goalKey: string; color: string; delay: number }> = ({ goalKey, color, delay }) => {
  const length = SPARK_LENGTHS[goalKey];
  const animatedProps = useLoopingStrokeDraw(delay, length);
  return (
    <Svg width={64} height={28} viewBox="0 0 64 28">
      <AnimatedPath d={SPARK_PATHS[goalKey]} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray={length} animatedProps={animatedProps} />
    </Svg>
  );
};

/**
 * Hand-drawn (not font-glyph) trend marks for the icon tile, in a 24x24 grid
 * — one continuous stroke each, so a single `strokeDashoffset` sweep draws
 * the line first and then the arrowhead/loop closes it off, matching the
 * "line draws itself" behaviour asked for. Built as plain SVG rather than
 * `AppIcon`'s Ionicons glyphs for two reasons: (1) a filled icon-font glyph
 * has no meaningful "stroke progress" to animate — this is what the previous
 * implementation worked around by animating the whole glyph's position
 * instead, which is the motion this replaces; (2) it also happens to remove
 * the icon font entirely from this tile, which is the most likely source of
 * the reported black-rectangle glitch (an unloaded/unregistered icon font
 * renders its fallback "missing glyph" box — solid and dark on Android in
 * particular — until the font finishes loading; not reliably reproducible
 * on the iOS Simulator used to verify this fix, but structurally impossible
 * once there is no font glyph left to fall back from).
 */
const ICON_PATHS: Record<'weight_loss' | 'maintenance' | 'muscle_gain', string> = {
  muscle_gain: 'M3 17 C 8 15, 13 9, 20 6 M14 6 L20 6 L20 12',
  weight_loss: 'M3 7 C 8 9, 13 15, 20 18 M20 12 L20 18 L14 18',
  maintenance:
    'M7 9 C 4.5 9 3 10.5 3 12 C 3 13.5 4.5 15 7 15 C 9.5 15 10.5 13 12 12 C 13.5 11 14.5 9 17 9 C 19.5 9 21 10.5 21 12 C 21 13.5 19.5 15 17 15 C 14.5 15 13.5 13 12 12 C 10.5 11 9.5 9 7 9 Z',
};
/**
 * The icon tile's trend mark — a plain, **static** SVG stroke (down arrow /
 * infinity / up arrow). Built as SVG rather than an icon-font glyph so there
 * is no font to fall back from, and deliberately not animated in any way:
 * the entire left-side icon area stays completely stationary (no stroke
 * draw, no float, no scale, no fade). The only element on the card that
 * animates is the right-side `Sparkline`.
 */
const IconGlyph: React.FC<{ goalKey: 'weight_loss' | 'maintenance' | 'muscle_gain' }> = ({ goalKey }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24">
    <Path d={ICON_PATHS[goalKey]} stroke="#FFFFFF" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface GoalCardProps {
  goalKey: 'weight_loss' | 'maintenance' | 'muscle_gain';
  title: string;
  outcome: string;
  gradient: readonly [string, string, ...string[]];
  accent: string;
  selected: boolean;
  /** True when a *different* card is selected — this card recedes slightly (scale/opacity) instead of just sitting at a neutral baseline, so the selected card reads as chosen relative to its siblings, not only via its own border color. */
  dimmed?: boolean;
  index: number;
  onPress: () => void;
}

/** Full-width, visually rich goal card — icon tile, outcome copy and an animated trend sparkline (down/flat/up) so the choice reads as an outcome, not just a label. */
export const GoalCard: React.FC<GoalCardProps> = React.memo(({ goalKey, title, outcome, gradient, accent, selected, dimmed, index, onPress }) => {
  const { theme } = useTheme();
  const selectedProgress = useSharedValue(selected ? 1 : 0);
  const dimProgress = useSharedValue(dimmed ? 1 : 0);
  // Immediate tactile feedback on touch-down, independent of the selection
  // state itself — a card can be pressed without (yet) becoming selected.
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // A gentle spring rather than a linear timing — lets the card settle
    // into its selected size with a small, premium overshoot instead of
    // stepping straight there, without ever returning to the unselected
    // size mid-transition (which would read as a flicker, not a bounce).
    selectedProgress.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [selected, selectedProgress]);

  useEffect(() => {
    dimProgress.value = withTiming(dimmed ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.standard });
  }, [dimmed, dimProgress]);

  // Split in two: the outer wrapper carries the transform + shadow (a
  // shadow needs room to render *outside* the view's own bounds, which
  // `overflow: 'hidden'` on the same view would clip away entirely); the
  // inner wrapper carries the border/background color and is the one with
  // `overflow: 'hidden'`, clipping its own content to the rounded corners.
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(selectedProgress.value, [0, 1], [1, 1.015]) * interpolate(dimProgress.value, [0, 1], [1, 0.97]) * pressScale.value },
    ],
    opacity: interpolate(dimProgress.value, [0, 1], [1, 0.6]),
    shadowOpacity: interpolate(selectedProgress.value, [0, 1], [0, 0.28]),
    shadowRadius: interpolate(selectedProgress.value, [0, 1], [0, 14]),
  }));

  // Selected fill = the goal's accent blended into the same warm-dark base,
  // pre-computed so both endpoints handed to `interpolateColor` are fully
  // opaque `#rrggbb` — the surface can never interpolate through a
  // see-through/dark rectangle, it just shifts tone.
  const selectedFill = useMemo(() => blendHex(CARD_FILL, accent, CARD_SELECTED_MIX), [accent]);

  const surfaceStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(selectedProgress.value, [0, 1], [onboardingGlass.border, accent]),
    backgroundColor: interpolateColor(selectedProgress.value, [0, 1], [CARD_FILL, selectedFill]),
  }));

  // The one unambiguous "this is chosen" mark — everything else (border
  // color, background wash, icon-tile halo) is state styling that
  // reinforces it rather than a second, competing indicator.
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: selectedProgress.value,
    transform: [{ scale: interpolate(selectedProgress.value, [0, 1], [0.5, 1]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.98, { duration: 100, easing: motion.easing.standard });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: 140, easing: motion.easing.standard });
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      // Horizontal margin isn't a smaller card width — it's the headroom the
      // selected-state scale transform (up to ~1.5%) needs so its edges
      // never reach the ScrollView's own clipping bounds, which sit flush
      // against the card on both sides otherwise. Without it, selecting a
      // full-bleed card pushes its edges past the ScrollView and the
      // selected card visibly clips left/right.
      style={{ marginBottom: theme.spacing.sm, marginHorizontal: theme.spacing.xs }}
    >
      {/* This outer view exists only to carry the transform + iOS drop shadow
          (a shadow needs to render outside the view's bounds, which the inner
          view's `overflow: 'hidden'` would clip). Its `backgroundColor` is
          never seen — the opaque inner surface below covers it exactly — it's
          here purely so iOS shades the shadow from a clean rounded-rect
          silhouette instead of the content's alpha shape. Android `elevation`
          was removed on purpose: on a rounded view it was painting a
          rectangular dark backing that showed through as the "hollow" patch. */}
      <Animated.View
        style={[{ borderRadius: theme.radius.xl, backgroundColor: CARD_FILL, shadowColor: accent, shadowOffset: { width: 0, height: 6 } }, shadowStyle]}
      >
        <Animated.View style={[{ borderRadius: theme.radius.xl, borderWidth: 1.5, overflow: 'hidden' }, surfaceStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md }}>
            <View style={{ width: 48, height: 48, marginRight: theme.spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
              {/* Completely static: fixed size, fixed border colour, no scale /
                  fade / stroke-draw. Only the right-side Sparkline animates. */}
              <View style={{ width: 48, height: 48, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
                <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <IconGlyph goalKey={goalKey} />
                </LinearGradient>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSmall" weight="700" color={onboardingGlass.textPrimary}>
                {title}
              </AppText>
              <AppText variant="bodySmall" color={onboardingGlass.textSecondary} style={{ marginTop: 2 }}>
                {outcome}
              </AppText>
            </View>
            <Sparkline goalKey={goalKey} color={accent} delay={motion.staggerStepMs * index} />
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 10,
                right: 10,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              },
              badgeStyle,
            ]}
          >
            <AppIcon name="checkmark" size={13} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

GoalCard.displayName = 'GoalCard';
