import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export const AppDivider: React.FC<{ spacing?: number }> = React.memo(({ spacing }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: spacing ?? theme.spacing.sm,
      }}
    />
  );
});

AppDivider.displayName = 'AppDivider';
