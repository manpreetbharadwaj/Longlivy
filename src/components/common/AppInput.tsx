import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface AppInputProps extends TextInputProps {
  label?: string;
  errorText?: string;
}

export const AppInput: React.FC<AppInputProps> = React.memo(({ label, errorText, style, ...rest }) => {
  const { theme } = useTheme();
  return (
    <View>
      {label ? (
        <AppText variant="label" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xxs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          {
            height: theme.componentSizes.inputHeight,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: errorText ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            paddingHorizontal: theme.spacing.sm,
            color: theme.colors.textPrimary,
            fontSize: theme.typography.bodyLarge.fontSize,
          },
          style,
        ]}
        {...rest}
      />
      {errorText ? (
        <AppText variant="caption" color={theme.colors.danger} style={{ marginTop: theme.spacing.xxs }}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
});

AppInput.displayName = 'AppInput';
