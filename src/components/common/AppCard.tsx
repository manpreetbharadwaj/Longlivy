import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
  elevated?: boolean;
  /** 'default': the card surface (white/near-white). 'muted': the app's sunken/secondary surface — for a card nested inside another card, or a lower-emphasis row in a list of cards. */
  tone?: 'default' | 'muted';
  accessibilityLabel?: string;
}

export const AppCard: React.FC<AppCardProps> = React.memo(
  ({ children, onPress, style, padded = true, elevated = true, tone = 'default', accessibilityLabel }) => {
    const { theme } = useTheme();
    const cardStyle: ViewStyle = {
      backgroundColor: tone === 'muted' ? theme.colors.surfaceElevated : theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: padded ? theme.spacing.md : 0,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...(elevated ? theme.shadows.card : {}),
    };

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [cardStyle, style, pressed ? { opacity: 0.85 } : null]}
        >
          {children}
        </Pressable>
      );
    }

    return <View style={[cardStyle, style]}>{children}</View>;
  }
);

AppCard.displayName = 'AppCard';
