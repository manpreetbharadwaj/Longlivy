import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const AppButton: React.FC<AppButtonProps> = React.memo(
  ({ label, onPress, variant = 'primary', disabled, loading, fullWidth = true, icon, style, accessibilityLabel }) => {
    const { theme } = useTheme();

    const handlePress = useCallback(() => {
      if (!disabled && !loading) onPress();
    }, [disabled, loading, onPress]);

    // Five explicit hierarchy rungs, from "the one thing on this screen you
    // want tapped" down to "de-emphasized but still an action":
    // primary (filled brand + lift) > secondary (filled, no lift) >
    // outline (bordered, no fill) > ghost (text-only) > danger (its own
    // filled color, outside the emphasis ladder since it's about risk, not
    // priority).
    const palette: Record<ButtonVariant, { bg: string; text: string; border?: string; elevated?: boolean }> = {
      primary: { bg: theme.colors.primary, text: theme.colors.onPrimary, elevated: true },
      secondary: { bg: theme.colors.secondary, text: theme.colors.onSecondary },
      outline: { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary },
      ghost: { bg: 'transparent', text: theme.colors.primary },
      danger: { bg: theme.colors.danger, text: theme.colors.textInverse },
    };
    const colors = palette[variant];

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [
          {
            height: theme.componentSizes.buttonHeight,
            borderRadius: theme.radius.lg,
            backgroundColor: colors.bg,
            borderWidth: colors.border ? 1.5 : 0,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
            ...(colors.elevated && !disabled ? theme.shadows.elevated : null),
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            {icon}
            <AppText variant="headingSmall" color={colors.text} style={icon ? { marginLeft: theme.spacing.xs } : undefined}>
              {label}
            </AppText>
          </>
        )}
      </Pressable>
    );
  }
);

AppButton.displayName = 'AppButton';
