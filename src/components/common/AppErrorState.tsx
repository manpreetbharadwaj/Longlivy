import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { AppEmptyState } from './AppEmptyState';

interface AppErrorStateProps {
  /** Already-localized message. Omit for the generic "please try again" copy. */
  message?: string;
  onRetry?: () => void;
}

export const AppErrorState: React.FC<AppErrorStateProps> = React.memo(({ message, onRetry }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <AppEmptyState
      icon="alert-circle-outline"
      iconColor={theme.colors.danger}
      title={t('states.errorTitle')}
      message={message ?? t('states.errorBody')}
      actionLabel={onRetry ? t('states.retry') : undefined}
      onAction={onRetry}
    />
  );
});

AppErrorState.displayName = 'AppErrorState';
