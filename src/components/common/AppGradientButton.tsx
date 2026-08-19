import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { ctaGradient } from '@/theme/gradients';

interface AppGradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  colors?: readonly [string, string, ...string[]];
  textColor?: string;
  style?: ViewStyle;
}

/**
 * Gradient CTA for premium "moment" screens (onboarding hero, feature
 * intros) where the flat AppButton palette would be too plain against a
 * dark gradient background. AppButton stays the default everywhere else —
 * this is deliberately a separate component so the common case never picks
 * up gradient-rendering cost or dark-background assumptions.
 */
export const AppGradientButton: React.FC<AppGradientButtonProps> = React.memo(
  ({ label, onPress, disabled, loading, fullWidth = true, colors = ctaGradient, textColor = '#FFFFFF', style }) => {
    const { theme } = useTheme();

    const handlePress = useCallback(() => {
      if (!disabled && !loading) onPress();
    }, [disabled, loading, onPress]);

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [{ alignSelf: fullWidth ? 'stretch' : 'flex-start', opacity: disabled ? 0.5 : pressed ? 0.88 : 1 }, style]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: theme.componentSizes.buttonHeight,
            borderRadius: theme.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          {loading ? <ActivityIndicator color={textColor} /> : <AppText variant="headingSmall" color={textColor}>{label}</AppText>}
        </LinearGradient>
      </Pressable>
    );
  }
);

AppGradientButton.displayName = 'AppGradientButton';
