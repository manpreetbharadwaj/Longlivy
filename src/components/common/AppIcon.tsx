import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export type AppIconName = React.ComponentProps<typeof Ionicons>['name'];
export type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface AppIconProps {
  name: AppIconName | MaterialCommunityIconName;
  size?: number;
  color?: string;
  /** Icon glyph family. Defaults to Ionicons — only opt into 'material-community' for a specific glyph Ionicons doesn't have (e.g. the seated meditation figure). */
  family?: 'ionicons' | 'material-community';
}

/**
 * Single entry point for iconography. Every icon in the app should render
 * through this component instead of raw emoji, so sizing, color and glyph
 * choices stay consistent across screens.
 */
export const AppIcon: React.FC<AppIconProps> = React.memo(({ name, size, color, family = 'ionicons' }) => {
  const { theme } = useTheme();
  const resolvedSize = size ?? theme.componentSizes.iconMedium;
  const resolvedColor = color ?? theme.colors.textPrimary;
  if (family === 'material-community') {
    return <MaterialCommunityIcons name={name as MaterialCommunityIconName} size={resolvedSize} color={resolvedColor} />;
  }
  return <Ionicons name={name as AppIconName} size={resolvedSize} color={resolvedColor} />;
});

AppIcon.displayName = 'AppIcon';
