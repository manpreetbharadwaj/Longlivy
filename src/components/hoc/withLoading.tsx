import React from 'react';
import { AppLoader } from '@/components/common/AppLoader';

interface WithLoadingProps {
  isLoading: boolean;
}

/** Wraps a component so it shows a shared loader instead of duplicating the check everywhere. */
export function withLoading<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped: React.FC<P & WithLoadingProps> = ({ isLoading, ...rest }) => {
    if (isLoading) return <AppLoader />;
    return <Component {...(rest as P)} />;
  };
  Wrapped.displayName = `withLoading(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Wrapped;
}
