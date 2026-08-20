import React from 'react';
import { Pressable, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HeroCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * The AppCard equivalent for dark hero surfaces — same API (children,
 * onPress, style) so existing AppCard usages can switch over directly.
 * AppCard itself is untouched; this is a parallel component, not a
 * replacement, since most of the app still renders on the light theme.
 */
export const HeroCard: React.FC<HeroCardProps> = React.memo(({ children, onPress, style, accessibilityLabel }) => {
  const { theme } = useTheme();
  const cardStyle: ViewStyle = {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
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
});

HeroCard.displayName = 'HeroCard';
