import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface AppBadgeProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const AppBadge: React.FC<AppBadgeProps> = React.memo(({ label, tone = 'neutral' }) => {
  const { theme } = useTheme();
  const toneColor: Record<NonNullable<AppBadgeProps['tone']>, string> = {
    neutral: theme.colors.textSecondary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
    primary: theme.colors.primary,
  };
  const color = toneColor[tone];

  return (
    <View
      style={{
        backgroundColor: color + '22',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <AppText variant="caption" color={color} weight="700">
        {label}
      </AppText>
    </View>
  );
});

AppBadge.displayName = 'AppBadge';
