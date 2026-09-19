import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingAccent, onboardingData, onboardingCtaGradient, onboardingGlass, onboardingPillarColors } from '@/features/onboarding/theme/onboardingTheme';
import { brand } from '@/config/branding';

/**
 * One floating "live signal" chip — a small, meaningful glimpse into a real
 * Longlivy pillar (icon + accent match the same pillar colors used on the
 * bottom tab bar and throughout the app, so the scene already previews
 * what the person is about to navigate into) rather than a generic
 * notification bubble. Everything that makes one chip different from the
 * next — icon, label, accent, position, drift timing/direction, apparent
 * depth — is passed in as data (see `SIGNALS` below), so the set can be
 * edited without touching this component.
 */
interface SignalSpec {
  id: string;
  icon: AppIconName | MaterialCommunityIconName;
  family?: 'ionicons' | 'material-community';
  labelKey: TranslationKey;
  accent: string;
  style: { top?: number; bottom?: number; left?: number; right?: number };
  /** Stagger index — converted to a mount delay via motion.staggerStepMs, same convention as the rest of onboarding. */
  order: number;
  /** One full up-down drift cycle, in ms — deliberately different per chip so nothing on screen moves in lock-step. */
  driftMs: number;
  /** Vertical drift distance in px. */
  driftPx: number;
  /** Flips which way a chip drifts first — half go up-first, half down-first, for asynchronous motion. */
  driftUp: boolean;
  /** A very light horizontal companion drift (a fraction of driftPx) so the motion reads as a gentle orbit rather than a pure vertical bob. Sign flips per chip. */
  driftXSign: 1 | -1;
  /** Rest-state scale — chips slightly under 1 read as "further away," slightly over as "closer," a cheap depth cue without real parallax. */
  depth: number;
}

/**
 * Five chips for the app's five real pillars (same set as the bottom tab
 * bar), not eight — enough to read as "an ecosystem" at a glance without
 * competing with the identity mark for attention. Content is illustrative
 * sample data (nothing here is a live query — this is the pre-auth hero,
 * there is no signed-in user yet), but every value is the kind of number
 * Longlivy actually surfaces once someone is using it.
 */
const SIGNALS: SignalSpec[] = [
  {
    id: 'fasting',
    icon: 'timer-outline',
    labelKey: 'onboarding.welcome.signals.fasting',
    accent: onboardingPillarColors.fasting,
    style: { top: 96, left: 2 },
    order: 4,
    driftMs: 2600,
    driftPx: 7,
    driftUp: true,
    driftXSign: 1,
    depth: 1.02,
  },
  {
    id: 'nutrition',
    icon: 'restaurant-outline',
    labelKey: 'onboarding.welcome.signals.nutrition',
    accent: onboardingPillarColors.nutrition,
    style: { top: 154, right: -2 },
    order: 5,
    driftMs: 3100,
    driftPx: 6,
    driftUp: false,
    driftXSign: -1,
    depth: 0.94,
  },
  {
    id: 'activity',
    icon: 'walk-outline',
    labelKey: 'onboarding.welcome.signals.activity',
    accent: onboardingPillarColors.activity,
    style: { bottom: 272, left: 6 },
    order: 6,
    driftMs: 2900,
    driftPx: 8,
    driftUp: false,
    driftXSign: 1,
    depth: 1,
  },
  {
    id: 'meditation',
    icon: 'meditation',
    family: 'material-community',
    labelKey: 'onboarding.welcome.signals.meditation',
    accent: onboardingPillarColors.meditation,
    style: { bottom: 176, right: 2 },
    order: 7,
    driftMs: 3400,
    driftPx: 6,
    driftUp: true,
    driftXSign: -1,
    depth: 0.96,
  },
  {
    id: 'statistics',
    icon: 'stats-chart-outline',
    labelKey: 'onboarding.welcome.signals.statistics',
    accent: '#5C9494',
    style: { bottom: 84, left: 58 },
    order: 8,
    driftMs: 2400,
    driftPx: 5,
    driftUp: true,
    driftXSign: 1,
    depth: 0.9,
  },
];

const SignalChip: React.FC<SignalSpec> = ({ icon, family, labelKey, accent, style, order, driftMs, driftPx, driftUp, driftXSign, depth }) => {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const mountScale = useSharedValue(0.9);
  // A single, continuously-advancing phase rather than two separate
  // withTiming "legs" (0->peak, peak->trough) stitched end to end — the old
  // two-leg version eased to a dead stop at *both* ends of *every* leg, so
  // the chip visibly paused at each extreme before the next leg eased back
  // out, which read as a soft "stutter" rather than one continuous drift.
  // A linearly-advancing phase fed through Math.sin() below produces the
  // same natural slow-at-the-edges/fast-through-the-middle motion as a
  // single unbroken curve — velocity is continuous everywhere, including
  // across the phase wrapping back past 2π, since sin(2π) === sin(0). Same
  // technique already proven on this screen's own rotating ring (SignalMark).
  const phase = useSharedValue(0);
  const delay = motion.duration.slow + motion.staggerStepMs * order;
  const phaseOffset = driftUp ? 0 : Math.PI;

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
    mountScale.value = withDelay(delay, withTiming(depth, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
    phase.value = withDelay(delay + motion.duration.slow, withRepeat(withTiming(2 * Math.PI, { duration: driftMs * 2, easing: Easing.linear }), -1, false));
  }, [delay, opacity, mountScale, phase, depth, driftMs]);

  const animatedStyle = useAnimatedStyle(() => {
    const s = Math.sin(phase.value + phaseOffset);
    return {
      opacity: opacity.value,
      transform: [{ translateY: s * driftPx }, { translateX: s * driftPx * 0.35 * driftXSign }, { scale: mountScale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
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
        animatedStyle,
      ]}
    >
      <AppIconTile name={icon} family={family} color={accent} size={26} iconSize={14} shape="circle" style={{ marginRight: 8 }} />
      <AppText variant="caption" color="rgba(255,255,255,0.8)" weight="600">
        {t(labelKey)}
      </AppText>
    </Animated.View>
  );
};

/**
 * Concentric scanning rings around the wordmark — a slow breathing ring
 * (indigo, echoes calm/vitality) plus a thin rotating cyan ring (echoes
 * "live signal"/biohacking read) so the mark feels instrumented, not
 * decorative.
 *
 * LOGO PLACEHOLDER: the "L" glyph below is a temporary stand-in for the
 * final Longlivy logo, which is still with the designer. The 92x92 gradient
 * tile is the exact slot the finished mark will drop into — same size,
 * same position, same surrounding rings/spacing already tuned around it.
 * Swapping it later is a one-line change: replace the `<AppText>L</AppText>`
 * below with an `<Image source={...} />` (or an SVG mark) sized to fill
 * this same tile; nothing else on this screen needs to move.
 */
// One full breathe cycle (rest -> peak -> rest), in ms — matches the original
// two-leg timing's total duration (1900 + 1900) so the pace is unchanged.
const BREATHE_CYCLE_MS = 3800;
const BREATHE_MIN_SCALE = 1;
const BREATHE_MAX_SCALE = 1.16;
const BREATHE_CENTER = (BREATHE_MIN_SCALE + BREATHE_MAX_SCALE) / 2;
const BREATHE_AMPLITUDE = (BREATHE_MAX_SCALE - BREATHE_MIN_SCALE) / 2;

const SignalMark: React.FC = () => {
  // A continuous phase driving `cos`, not two eased legs stitched together —
  // the old withSequence(out, in) pair decelerated to a stop arriving at the
  // peak (fine) but then arrived at the *rest* scale at full speed on one leg
  // and immediately departed at full speed the other way on the next lap, an
  // instantaneous velocity-direction reversal every ~3.8s. Same seamless
  // technique as `SignalChip`'s drift and the rotating ring below: velocity
  // is continuous everywhere, including across the phase wrapping past 2π.
  const breathe = useSharedValue(0);
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.85);
  const rotate = useSharedValue(0);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    markScale.value = withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
    breathe.value = withDelay(motion.duration.slow, withRepeat(withTiming(2 * Math.PI, { duration: BREATHE_CYCLE_MS, easing: Easing.linear }), -1, false));
    rotate.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [breathe, markOpacity, markScale, rotate]);

  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value, transform: [{ scale: markScale.value }] }));
  const breatheStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value * 0.45,
    transform: [{ scale: BREATHE_CENTER - BREATHE_AMPLITUDE * Math.cos(breathe.value) }],
  }));
  const rotateStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value * 0.7, transform: [{ rotate: `${rotate.value}deg` }] }));

  return (
    <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: onboardingAccent }, breatheStyle]} />
      <Animated.View
        style={[
          { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1.5, borderTopColor: onboardingData, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
          rotateStyle,
        ]}
      />
      {/* --- Final Longlivy logo drops in here, same 92x92 tile --- */}
      <Animated.View style={[{ width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, markStyle]}>
        <LinearGradient colors={onboardingCtaGradient} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="displayMedium" color="#FFFFFF" weight="800">
            L
          </AppText>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

/**
 * A near-imperceptible continuous drift, wrapped *around* (not instead of)
 * a one-shot entrance like `FadeSlideIn` — it starts only once that
 * entrance has fully settled, so mounting is unaffected, and it never
 * touches layout, only `transform`. Same seamless continuous-phase
 * technique as `SignalChip`'s drift and `SignalMark`'s rotating ring: one
 * linearly-advancing phase through `Math.sin`, not eased legs stitched
 * together, so there's no pause-and-restart feel at the top/bottom of the
 * drift or at the loop point.
 */
const GentleFloat: React.FC<{ startDelay: number; amplitude?: number; periodMs?: number; phaseOffset?: number; children: React.ReactNode }> = ({
  startDelay,
  amplitude = 3,
  periodMs = 5400,
  phaseOffset = 0,
  children,
}) => {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withDelay(startDelay, withRepeat(withTiming(2 * Math.PI, { duration: periodMs, easing: Easing.linear }), -1, false));
  }, [startDelay, phase, periodMs]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin(phase.value + phaseOffset) * amplitude }] }));

  return <Animated.View style={style}>{children}</Animated.View>;
};

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>
          {SIGNALS.map((signal) => (
            <SignalChip key={signal.id} {...signal} />
          ))}

          <View style={{ marginBottom: theme.spacing.lg }}>
            <SignalMark />
          </View>

          <FadeSlideIn delay={motion.duration.slow}>
            <AppText variant="caption" color={onboardingData} align="center" style={{ letterSpacing: 3, marginBottom: theme.spacing.sm }}>
              {brand.wordmark}
            </AppText>
          </FadeSlideIn>

          {/* The tagline reads as one composed lockup with the wordmark above it —
              two tight lines, not a headline-plus-subtitle pair — so it feels like
              part of the identity rather than supporting copy underneath it. Each
              line gets its own hairline-subtle continuous float once it has fully
              entered — different period/phase per line so they never move in
              lock-step with each other or with the signal chips floating nearby. */}
          <GentleFloat startDelay={motion.duration.slow * 2 + motion.staggerStepMs * 2} amplitude={3} periodMs={5400}>
            <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 2}>
              <AppText variant="displayLarge" color={onboardingGlass.textPrimary} align="center" weight="800" style={{ letterSpacing: 0.2, lineHeight: 40 }}>
                {t('onboarding.welcome.liveWell')}
              </AppText>
            </FadeSlideIn>
          </GentleFloat>
          <GentleFloat startDelay={motion.duration.slow * 2 + motion.staggerStepMs * 3} amplitude={3} periodMs={6100} phaseOffset={Math.PI}>
            <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 3}>
              <AppText variant="displayLarge" color={onboardingAccent} align="center" weight="800" style={{ letterSpacing: 0.2, lineHeight: 40, marginTop: 2 }}>
                {t('onboarding.welcome.liveLong')}
              </AppText>
            </FadeSlideIn>
          </GentleFloat>
        </View>

        <FadeSlideIn delay={motion.duration.slow + motion.staggerStepMs * 10} style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppGradientButton label={t('onboarding.welcome.begin')} onPress={() => navigation.navigate('Value')} colors={onboardingCtaGradient} />
        </FadeSlideIn>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
