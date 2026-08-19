import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface HeroTextFieldProps extends TextInputProps {
  label?: string;
}

/** Text input for the dark hero screens — the AppInput equivalent, styled for a translucent glass surface instead of a light card. */
export const HeroTextField: React.FC<HeroTextFieldProps> = React.memo(({ label, style, ...rest }) => {
  const { theme } = useTheme();
  return (
    <View>
      {label ? (
        <AppText variant="label" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.xxs }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={[
          {
            height: theme.componentSizes.inputHeight,
            borderRadius: theme.radius.md,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.16)',
            backgroundColor: 'rgba(255,255,255,0.08)',
            paddingHorizontal: theme.spacing.sm,
            color: '#FFFFFF',
            fontSize: theme.typography.bodyLarge.fontSize,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});

HeroTextField.displayName = 'HeroTextField';
