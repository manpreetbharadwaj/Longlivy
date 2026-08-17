import React from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';

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
}) => {
  const { theme } = useTheme();
  return (
    <AppScreen>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              marginRight: i < totalSteps - 1 ? 4 : 0,
              borderRadius: 2,
              backgroundColor: i <= step ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
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
