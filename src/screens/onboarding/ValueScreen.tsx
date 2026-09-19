import React, { useCallback, useState } from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { onboardingPillarColors, onboardingCtaGradient, onboardingGlass, onboardingPanelGradient, onboardingAccent, PillarKey } from '@/features/onboarding/theme/onboardingTheme';
import { PillarVisual } from '@/features/onboarding/components/PillarVisual';
import { GlowOrb } from '@/components/common/GlowOrb';

// Title + description resolved at render via `t('onboarding.value.pillars.<key>')`.
const PILLARS: { key: PillarKey; icon: AppIconName }[] = [
  { key: 'fasting', icon: 'timer-outline' },
  { key: 'nutrition', icon: 'restaurant-outline' },
  { key: 'activity', icon: 'walk-outline' },
  { key: 'meditation', icon: 'leaf-outline' },
];

const CARD_HEIGHT = 400;
const STACK_Y_STEP = 16;
const STACK_SCALE_STEP = 0.055;
const VISIBLE_DEPTH = 3;
const SPRING = { damping: 16, stiffness: 180 };

/**
 * One card in the deck. Always mounted (stable `key`) regardless of its
 * current position so the spring between stack slots is continuous instead
 * of a remount-cut; only the top card (`stackPosition === 0`) is draggable.
 */
const DeckCard: React.FC<{
  pillar: (typeof PILLARS)[number];
  stackPosition: number;
  cardWidth: number;
  isTop: boolean;
  onSwiped: () => void;
}> = ({ pillar, stackPosition, cardWidth, isTop, onSwiped }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const color = onboardingPillarColors[pillar.key];

  // Settled stack transform — animates whenever this card's slot changes
  // (a card behind moving up to top, or the top card retiring to the back).
  const settleY = useSharedValue(stackPosition * STACK_Y_STEP);
  const settleScale = useSharedValue(1 - stackPosition * STACK_SCALE_STEP);
  const settleOpacity = useSharedValue(stackPosition < VISIBLE_DEPTH ? 1 - stackPosition * 0.22 : 0);

  React.useEffect(() => {
    settleY.value = withSpring(stackPosition * STACK_Y_STEP, SPRING);
    settleScale.value = withSpring(1 - stackPosition * STACK_SCALE_STEP, SPRING);
    settleOpacity.value = withTiming(stackPosition < VISIBLE_DEPTH ? 1 - stackPosition * 0.22 : 0, { duration: motion.duration.base });
  }, [stackPosition, settleY, settleScale, settleOpacity]);

  // Drag values — only ever driven while this card is on top.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const commitSwipe = useCallback(() => {
    dragX.value = 0;
    dragY.value = 0;
    onSwiped();
  }, [dragX, dragY, onSwiped]);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY * 0.12;
    })
    .onEnd((e) => {
      const threshold = cardWidth * 0.28;
      const shouldSwipe = Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > 900;
      if (shouldSwipe) {
        const direction = e.translationX >= 0 ? 1 : -1;
        dragX.value = withTiming(direction * cardWidth * 1.4, { duration: motion.duration.base }, (finished) => {
          if (finished) runOnJS(commitSwipe)();
        });
        dragY.value = withTiming(dragY.value + 40, { duration: motion.duration.base });
      } else {
        dragX.value = withSpring(0, SPRING);
        dragY.value = withSpring(0, SPRING);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(dragX.value, [-cardWidth, cardWidth], [-12, 12], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: dragX.value },
        { translateY: settleY.value + dragY.value },
        { scale: settleScale.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: settleOpacity.value,
    };
  });

  // A soft directional glow on the card's own border — grows as the top
  // card is dragged, in whichever direction it's headed. Communicates
  // "release to advance", not a like/reject judgment. Rests at the same
  // border tone every other glass surface in onboarding uses (HeroOptionCard,
  // HeroCard, …) — previously a bespoke, much fainter `0.1`, which was the
  // single biggest reason the deck read as barely-there against the
  // background instead of like a real, premium card.
  const glowStyle = useAnimatedStyle(() => {
    const strength = interpolate(Math.abs(dragX.value), [0, cardWidth * 0.5], [0, 1], Extrapolation.CLAMP);
    return {
      borderColor: interpolateColor(strength, [0, 1], [onboardingGlass.border, color]),
      opacity: 1,
    };
  });

  return (
    <Animated.View
      pointerEvents={isTop ? 'auto' : 'none'}
      style={[
        { position: 'absolute', width: cardWidth, height: CARD_HEIGHT, borderRadius: theme.radius.xl },
        // Elevation only on the top card — it's what "lifts" the top of the
        // stack above the receding cards behind it, rather than every card
        // in the deck casting the same shadow on top of each other.
        isTop
          ? { shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 10 }
          : null,
        cardStyle,
      ]}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1, borderRadius: theme.radius.xl, overflow: 'hidden', borderWidth: 1.5 }, glowStyle]}>
          <LinearGradient colors={onboardingPanelGradient} style={{ flex: 1 }}>
            {isTop ? (
              // The full showcase composition — hero visual on top, large title +
              // short message beneath it — only mounted for the top card. Cards
              // behind it stay a quiet icon watermark (see the `else` branch):
              // a legible composition bottom-anchored on every stacked card would
              // overlap, since they're the same size offset by only a few px
              // (that's what makes them read as a physical stack).
              <>
                {/* A soft accent glow behind the hero visual — the one place each
                    card's own color is allowed to be prominent, kept as a real
                    radial falloff (GlowOrb, same primitive every other "hero"
                    atmosphere in the app uses) rather than a flat translucent
                    disc with a hard edge, so it reads as soft depth rather than
                    a colored sticker behind the visual. Re-mounts (and
                    re-fades-in) every time this pillar becomes the top card,
                    along with everything else below. */}
                <FadeSlideIn
                  style={{ position: 'absolute', top: -30, alignSelf: 'center', width: cardWidth * 0.6, height: cardWidth * 0.6 }}
                  fromY={0}
                  fromScale={0.8}
                >
                  <GlowOrb size={cardWidth * 0.6} color={color} opacity={0.22} pulse style={{ top: 0, left: 0 }} />
                </FadeSlideIn>

                <View style={{ flex: 1, paddingTop: theme.spacing.xl }}>
                  <FadeSlideIn fromScale={0.92} style={{ flex: 1.05, alignItems: 'center', justifyContent: 'center' }}>
                    <PillarVisual pillarKey={pillar.key} color={color} />
                  </FadeSlideIn>

                  <View style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
                    <FadeSlideIn delay={motion.staggerStepMs * 2}>
                      <AppText variant="displayLarge" weight="800" color={onboardingGlass.textPrimary} style={{ letterSpacing: 1 }}>
                        {t(`onboarding.value.pillars.${pillar.key}.title`).toUpperCase()}
                      </AppText>
                    </FadeSlideIn>
                    <FadeSlideIn delay={motion.staggerStepMs * 4}>
                      <AppText variant="bodyMedium" color={onboardingGlass.textSecondary} style={{ marginTop: theme.spacing.xxs }}>
                        {t(`onboarding.value.pillars.${pillar.key}.desc`)}
                      </AppText>
                    </FadeSlideIn>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    backgroundColor: `${color}33`,
                    borderWidth: 1.5,
                    borderColor: color,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name={pillar.icon} size={28} color={color} />
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

/**
 * The "show value" beat between Welcome and personalization — four pillars
 * as an original, physical-feeling swipe deck (drag the top card away to
 * reveal the next, stacked cards peeking behind with depth/scale/opacity).
 * Not a copy of any existing swipe-card product's chrome — just the same
 * underlying "drag to advance" gesture concept, restyled entirely in
 * Longlivy's own glass/glow language. Replaces the old node-graph "data
 * connects itself" concept entirely.
 */
export const ValueScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = width - theme.spacing.md * 2;
  const [activeIndex, setActiveIndex] = useState(0);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % PILLARS.length);
  }, []);

  return (
    <OnboardingBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, padding: theme.spacing.md }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} style={{ width: 32, height: 32, justifyContent: 'center', marginBottom: theme.spacing.md }}>
            <AppIcon name="chevron-back" size={24} color={onboardingGlass.textPrimary} />
          </Pressable>

          <FadeSlideIn>
            <AppText variant="displayMedium" color={onboardingGlass.textPrimary}>
              {t('onboarding.value.title')}
            </AppText>
            <AppText variant="bodyLarge" color={onboardingGlass.textSecondary} style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
              {t('onboarding.value.subtitle')}
            </AppText>
          </FadeSlideIn>

          <View style={{ height: CARD_HEIGHT + STACK_Y_STEP * (VISIBLE_DEPTH - 1), alignItems: 'center' }}>
            {/* Sorted by descending stackPosition (furthest-back first) so paint
                order matches the *visual* stack, not PILLARS' fixed array order —
                otherwise a later pillar (e.g. "meditation") always paints over an
                earlier one (e.g. "fasting") regardless of which is actually on top
                of the stack right now. Harmless to reorder: keys are stable, so
                React reconciles these as the same mounted instances either way. */}
            {PILLARS.map((p, i) => ({ p, stackPosition: (i - activeIndex + PILLARS.length) % PILLARS.length }))
              .sort((a, b) => b.stackPosition - a.stackPosition)
              .map(({ p, stackPosition }) => (
                <DeckCard key={p.key} pillar={p} stackPosition={stackPosition} cardWidth={cardWidth} isTop={stackPosition === 0} onSwiped={advance} />
              ))}
          </View>

          {/* Slightly larger/brighter than before (was 0.25-opacity, easy to mistake for
              decoration rather than a tappable page control) — still restrained, but each
              dot now reads clearly as its own touch target, and the active one carries the
              brand accent instead of plain white so it ties back to the CTA below it. */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.lg }}>
            {PILLARS.map((p, i) => (
              <Pressable key={p.key} onPress={() => setActiveIndex(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('onboarding.value.showPillar', { name: t(`onboarding.value.pillars.${p.key}.title`) })}>
                <View
                  style={{
                    width: i === activeIndex ? 22 : 7,
                    height: 7,
                    borderRadius: 3.5,
                    marginHorizontal: 3,
                    backgroundColor: i === activeIndex ? onboardingAccent : 'rgba(255,255,255,0.3)',
                  }}
                />
              </Pressable>
            ))}
          </View>

          <View style={{ flex: 1 }} />

          <FadeSlideIn>
            <AppGradientButton label={t('common.continue')} onPress={() => navigation.navigate('Goal')} colors={onboardingCtaGradient} />
          </FadeSlideIn>
        </View>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
