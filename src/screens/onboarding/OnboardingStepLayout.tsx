import React from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { OnboardingBackground } from '@/features/onboarding/components/OnboardingBackground';
import { OnboardingProgressIndicator } from '@/features/onboarding/components/OnboardingProgressIndicator';
import { onboardingAccent, onboardingCtaGradient, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';

interface OnboardingStepLayoutProps {
  /** 1-indexed current step, shown as "Step X of totalSteps". Omit (with `totalSteps`) for a screen that isn't part of the numbered personalization stack — pass `eyebrow` instead. */
  step?: number;
  totalSteps?: number;
  /** Shown in place of the numbered progress line when `step`/`totalSteps` are omitted — a short label (e.g. "YOUR GOAL") for a screen that's a deliberate beat of its own rather than one of N steps. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
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
  nextLabel = 'Continue',
  nextDisabled,
  dimBackground,
}) => {
  const { theme } = useTheme();

  return (
    <OnboardingBackground dim={dimBackground}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <View style={{ flex: 1, padding: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              {onBack ? (
                <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} style={{ width: 32, height: 32, justifyContent: 'center' }}>
                  <AppIcon name="chevron-back" size={24} color={onboardingGlass.textPrimary} />
                </Pressable>
              ) : (
                <View style={{ width: 32 }} />
              )}
            </View>

            {step && totalSteps ? (
              <OnboardingProgressIndicator step={step} totalSteps={totalSteps} />
            ) : eyebrow ? (
              <View style={{ marginBottom: theme.spacing.xl }}>
                <AppText variant="caption" color={onboardingAccent} style={{ letterSpacing: 3 }}>
                  {eyebrow}
                </AppText>
              </View>
            ) : null}

            <FadeSlideIn>
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
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            <View style={{ marginTop: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
              <AppGradientButton label={nextLabel} onPress={onNext} disabled={nextDisabled} colors={onboardingCtaGradient} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </OnboardingBackground>
  );
};
