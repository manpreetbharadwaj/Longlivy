import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { AppEmptyState } from './AppEmptyState';

interface AppErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const AppErrorState: React.FC<AppErrorStateProps> = React.memo(({ message, onRetry }) => {
  const { theme } = useTheme();
  return (
    <AppEmptyState
      icon="alert-circle-outline"
      iconColor={theme.colors.danger}
      title="Something went wrong"
      message={message ?? 'Please try again.'}
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
});

AppErrorState.displayName = 'AppErrorState';
