import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppState(): AppStateStatus {
  const [state, setState] = useState<AppStateStatus>(AppState.currentState);
  const ref = useRef(state);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      ref.current = next;
      setState(next);
    });
    return () => sub.remove();
  }, []);

  return state;
}
