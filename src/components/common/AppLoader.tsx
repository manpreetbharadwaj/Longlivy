import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

export const AppLoader: React.FC<{ label?: string; fullscreen?: boolean }> = React.memo(({ label, fullscreen }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: fullscreen ? 1 : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
        backgroundColor: fullscreen ? theme.colors.background : 'transparent',
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.sm }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
});

AppLoader.displayName = 'AppLoader';
