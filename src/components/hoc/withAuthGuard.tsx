import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/selectors';
import { AppEmptyState } from '@/components/common/AppEmptyState';

/**
 * Guards a screen behind an authenticated session. RootNavigator already
 * keeps unauthenticated users out of the Main stack, so this mostly matters
 * for deep-linked or lazily-mounted screens.
 */
export function withAuthGuard<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    if (!isAuthenticated) {
      return <AppEmptyState icon="lock-closed-outline" title="Sign in required" message="Please log in to view this screen." />;
    }
    return <Component {...props} />;
  };
  Wrapped.displayName = `withAuthGuard(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Wrapped;
}
