import React, { useCallback, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { OnboardingProgressIndicator } from '@/features/onboarding/components/OnboardingProgressIndicator';
import { onboardingNeutral, onboardingCtaGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

interface OnboardingStepLayoutProps {
  /** 1-indexed current step, shown as "Step X of totalSteps". Omit (with `totalSteps`) for a screen that isn't part of the numbered personalization stack — pass `eyebrow` instead. */
  step?: number;
  totalSteps?: number;
  /** Shown in place of the numbered progress line when `step`/`totalSteps` are omitted — a short label (e.g. "YOUR GOAL") for a screen that's a deliberate beat of its own rather than one of N steps. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /**
   * Either plain content, or a render function receiving the actual pixel
   * height available for it — the ScrollView's own measured frame, i.e.
   * whatever's genuinely left after the header above and the Continue
   * button below on THIS device. Screens with a flexible visual (a figure,
   * an illustration) that must never force this region to scroll should use
   * the function form rather than guessing a fixed size or leaning on a
   * `flex: 1` child, which measures unreliably here — see
   * `contentAreaHeight` below for why.
   */
  children?: React.ReactNode | ((contentAreaHeight: number) => React.ReactNode);
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Loosens the atmosphere glows on content-dense steps (ruler pickers, goal cards). */
  dimBackground?: boolean;
}

/**
 * Shared chrome for onboarding's personalization stack — the onboarding-only
 * glass/glow visual system, a morphing progress line instead of segmented
 * boxes, and a pinned CTA footer so the primary action is always reachable
 * regardless of content height or keyboard state. Also used, via `eyebrow`,
 * by the Goal screen — the transition beat between "understanding Long
 * Livy" and the seven numbered steps (PersonalizeMe → Gender → Age → Height
 * → Weight → ActivityLevelStep → Micronutrients) — so it shares the same
 * chrome without being counted as one of them.
 */
export const OnboardingStepLayout: React.FC<OnboardingStepLayoutProps> = ({
  step,
  totalSteps,
  eyebrow,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel,
  nextDisabled,
  dimBackground,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // The ScrollView's own outer frame, measured directly rather than derived
  // from a `flex: 1` child living inside its `contentContainerStyle`. Those
  // two sound equivalent but aren't reliable in the same way: a `flex: 1`
  // *content-container* child is sized by a "how much room is left, given
  // what the rest of the content needs" negotiation that can settle on a
  // generous first-pass guess (particularly on Android) and never fully
  // correct itself once a real child renders into that guessed size — the
  // guess and the child reinforce each other into a value taller than the
  // ScrollView’s real bound, so content quietly overflows into a scroll.
  // The ScrollView's own frame, by contrast, is an ordinary sibling in a
  // plain (non-scrolling) flex column — a completely ordinary, reliable
  // `onLayout` measurement — so it's the trustworthy number to hand
  // screens that need to size a flexible visual against real leftover
  // space.
  const [contentAreaHeight, setContentAreaHeight] = useState(0);
  const handleContentAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setContentAreaHeight((prev) => (prev === height ? prev : height));
  }, []);

  return (
    <OnboardingBackground dim={dimBackground}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <View style={{ flex: 1, padding: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              {onBack ? (
                <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} style={{ width: 32, height: 32, justifyContent: 'center' }}>
                  <AppIcon name="chevron-back" size={24} color={onboardingGlass.textPrimary} />
                </Pressable>
              ) : (
                <View style={{ width: 32 }} />
              )}
            </View>

            {step && totalSteps ? (
              <FadeSlideIn fromY={10}>
                <OnboardingProgressIndicator step={step} totalSteps={totalSteps} />
              </FadeSlideIn>
            ) : eyebrow ? (
              <FadeSlideIn style={{ marginBottom: theme.spacing.xl }} fromY={10}>
                <AppText variant="caption" color={onboardingNeutral} style={{ letterSpacing: 3 }}>
                  {eyebrow}
                </AppText>
              </FadeSlideIn>
            ) : null}

            {/* Title enters slightly after the eyebrow above it — a small,
                consistent cascade (eyebrow -> title -> content) rather than
                everything appearing in one flat fade, applied here once so
                every onboarding step built on this shared layout gets it. */}
            <FadeSlideIn delay={eyebrow ? motion.staggerStepMs * 2 : 0}>
              <AppText variant="displayMedium" color={onboardingGlass.textPrimary}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="bodyLarge" color={onboardingGlass.textSecondary} style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
                  {subtitle}
                </AppText>
              ) : (
                <View style={{ marginBottom: theme.spacing.md }} />
              )}
            </FadeSlideIn>

            {/*
              Content scrolls in its own region between the (fixed) header and
              the (fixed) footer button — flexGrow:1 keeps short content
              centered/expanded like a plain flex:1 View, while taller content
              (e.g. a long ruler) scrolls instead of clipping behind the CTA.
            */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              onLayout={handleContentAreaLayout}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {typeof children === 'function' ? children(contentAreaHeight) : children}
            </ScrollView>

            <View style={{ marginTop: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
              <AppGradientButton label={nextLabel ?? t('common.continue')} onPress={onNext} disabled={nextDisabled} colors={onboardingCtaGradient} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
