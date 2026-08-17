import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export type AppIconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

/**
 * Single entry point for iconography. Every icon in the app should render
 * through this component (backed by Ionicons) instead of raw emoji, so
 * sizing, color and glyph choices stay consistent across screens.
 */
export const AppIcon: React.FC<AppIconProps> = React.memo(({ name, size, color }) => {
  const { theme } = useTheme();
  return <Ionicons name={name} size={size ?? theme.componentSizes.iconMedium} color={color ?? theme.colors.textPrimary} />;
});

AppIcon.displayName = 'AppIcon';
