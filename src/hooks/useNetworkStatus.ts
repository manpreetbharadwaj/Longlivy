import { useEffect, useState } from 'react';

/**
 * Prototype network status. Swap the internals for `@react-native-community/netinfo`
 * when wiring to a real backend — nothing downstream needs to change since
 * this hook's return type stays the same.
 */
export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline] = useState(true);

  useEffect(() => {
    // Placeholder for a real subscription (NetInfo.addEventListener, etc).
  }, []);

  return { isOnline };
}
