import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { TypographyTokens } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: keyof TypographyTokens;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = React.memo(
  ({ variant = 'bodyMedium', color, weight, align, style, children, ...rest }) => {
    const { theme } = useTheme();
    return (
      <Text
        style={[
          theme.typography[variant],
          { color: color ?? theme.colors.textPrimary, textAlign: align },
          weight ? { fontWeight: weight } : null,
          style,
        ]}
        {...rest}
      >
        {children}
      </Text>
    );
  }
);

AppText.displayName = 'AppText';
