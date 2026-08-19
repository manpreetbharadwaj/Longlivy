import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';

interface HeroTextFieldProps extends TextInputProps {
  label?: string;
  /** Renders a show/hide eye icon and manages obscuring internally — pass this instead of `secureTextEntry` for password fields. */
  isPassword?: boolean;
}

/** Text input for the dark hero screens — the AppInput equivalent, styled for a translucent glass surface instead of a light card. */
export const HeroTextField: React.FC<HeroTextFieldProps> = React.memo(({ label, style, isPassword, secureTextEntry, ...rest }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      {label ? (
        <AppText variant="label" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.xxs }}>
          {label}
        </AppText>
      ) : null}
      <View style={{ justifyContent: 'center' }}>
        <TextInput
          placeholderTextColor="rgba(255,255,255,0.35)"
          secureTextEntry={isPassword ? !visible : secureTextEntry}
          style={[
            {
              height: theme.componentSizes.inputHeight,
              borderRadius: theme.radius.md,
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.16)',
              backgroundColor: 'rgba(255,255,255,0.08)',
              paddingHorizontal: theme.spacing.sm,
              paddingRight: isPassword ? 44 : theme.spacing.sm,
              color: '#FFFFFF',
              fontSize: theme.typography.bodyLarge.fontSize,
            },
            style,
          ]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={{ position: 'absolute', right: 12, height: theme.componentSizes.inputHeight, justifyContent: 'center' }}
          >
            <AppIcon name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(255,255,255,0.55)" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

HeroTextField.displayName = 'HeroTextField';
