import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppIconTile } from './AppIconTile';
import { AppIconName } from './AppIcon';

interface AppEmptyStateProps {
  icon?: AppIconName;
  iconColor?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AppEmptyState: React.FC<AppEmptyStateProps> = React.memo(
  ({ icon = 'file-tray-outline', iconColor, title, message, actionLabel, onAction }) => {
    const { theme } = useTheme();
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg }}>
        <AppIconTile
          name={icon}
          shape="circle"
          size={72}
          iconSize={30}
          color={iconColor ?? theme.colors.textTertiary}
          style={{ marginBottom: theme.spacing.md }}
        />
        <AppText variant="headingSmall" align="center">
          {title}
        </AppText>
        {message ? (
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
            {message}
          </AppText>
        ) : null}
        {actionLabel && onAction ? (
          <AppButton label={actionLabel} onPress={onAction} fullWidth={false} variant="outline" />
        ) : null}
      </View>
    );
  }
);

AppEmptyState.displayName = 'AppEmptyState';
