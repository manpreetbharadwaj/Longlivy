import React, { useEffect } from 'react';

/**
 * Placeholder analytics hook — logs a screen view once on mount. Swap the
 * console.log for a real analytics SDK call later without touching screens.
 */
export function withScreenTracking<P extends object>(Component: React.ComponentType<P>, screenName: string) {
  const Wrapped: React.FC<P> = (props) => {
    useEffect(() => {
      console.log(`[Analytics] screen_view: ${screenName}`);
    }, []);
    return <Component {...props} />;
  };
  Wrapped.displayName = `withScreenTracking(${screenName})`;
  return Wrapped;
}
