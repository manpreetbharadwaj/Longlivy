import React from 'react';
import { View, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';
import { heroGradient } from '@/theme/gradients';

interface OnboardingStepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /**
   * 'hero' renders a full-bleed dark gradient "moment" screen (title/subtitle
   * in white, gradient CTA) instead of the standard light/dark-theme surface
   * — for the handful of onboarding screens meant to sell the app rather
   * than collect data. Defaults to 'default' so every existing step is
   * unaffected.
   */
  variant?: 'default' | 'hero';
}

export const OnboardingStepLayout: React.FC<OnboardingStepLayoutProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled,
  variant = 'default',
}) => {
  const { theme } = useTheme();

  const progressBar = (activeColor: string, trackColor: string) => (
    <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            marginRight: i < totalSteps - 1 ? 4 : 0,
            borderRadius: 2,
            backgroundColor: i <= step ? activeColor : trackColor,
          }}
        />
      ))}
    </View>
  );

  if (variant === 'hero') {
    return (
      <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={heroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <View style={{ flex: 1, padding: theme.spacing.md }}>
            {progressBar('#FFFFFF', 'rgba(255,255,255,0.18)')}
            <AppText variant="displayMedium" color="#FFFFFF">
              {title}
            </AppText>
            {subtitle ? (
              <AppText variant="bodyLarge" color="rgba(255,255,255,0.72)" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
                {subtitle}
              </AppText>
            ) : (
              <View style={{ marginBottom: theme.spacing.md }} />
            )}
            <View style={{ flex: 1 }}>{children}</View>
            <View style={{ marginTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
              <AppGradientButton label={nextLabel} onPress={onNext} disabled={nextDisabled} />
              {onBack ? (
                // Plain (not AppButton) so "Back" stays legible against the dark
                // hero gradient regardless of the app's light/dark theme mode —
                // AppButton's ghost variant uses theme.colors.primary, which is
                // a dark teal in light mode and would be nearly invisible here.
                <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ height: theme.componentSizes.buttonHeight, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xs }}>
                  <AppText variant="headingSmall" color="rgba(255,255,255,0.7)">
                    Back
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <AppScreen>
      {progressBar(theme.colors.primary, theme.colors.border)}
      <AppText variant="headingLarge">{title}</AppText>
      {subtitle ? (
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
          {subtitle}
        </AppText>
      ) : (
        <View style={{ marginBottom: theme.spacing.lg }} />
      )}
      <View style={{ flex: 1 }}>{children}</View>
      <View style={{ marginTop: theme.spacing.lg }}>
        <AppButton label={nextLabel} onPress={onNext} disabled={nextDisabled} />
        {onBack ? (
          <AppButton label="Back" onPress={onBack} variant="ghost" style={{ marginTop: theme.spacing.xs }} />
        ) : null}
      </View>
    </AppScreen>
  );
};
