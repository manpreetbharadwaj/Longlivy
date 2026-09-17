import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch } from '@/store/hooks';
import { recordSessionEventThunk } from '../meditationSlice';

/**
 * Records `backgrounded`/`foregrounded` session events from real app
 * lifecycle transitions — shared by MeditationPlayerScreen and
 * BreathingExerciseScreen so both kinds of session get the same accurate
 * event log, rather than duplicating this logic per screen.
 *
 * Deduplicated against AppState's noisy intermediate states: iOS fires
 * 'inactive' transiently during many ordinary transitions (control center,
 * a notification banner, the app-switcher gesture) before settling into
 * 'background' or back to 'active'. Only the first move away from 'active'
 * records `backgrounded`, and only the move back to 'active' records
 * `foregrounded` — never a duplicate pair for one real excursion.
 *
 * These events are informational only: MeditationSessionCalculator treats
 * both as no-ops for active/paused duration, since background/lock-screen
 * audio is expected to keep playing (see useMeditationAudioSession) —
 * backgrounding a still-playing session must not read as a pause.
 */
export function useMeditationSessionLifecycle(sessionId: string | null, isSessionActive: boolean): void {
  const dispatch = useAppDispatch();
  const isBackgroundedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || !isSessionActive) return;

    const handleChange = (nextState: AppStateStatus) => {
      const isNowActive = nextState === 'active';
      if (!isNowActive && !isBackgroundedRef.current) {
        isBackgroundedRef.current = true;
        dispatch(recordSessionEventThunk({ sessionId, type: 'backgrounded' }));
      } else if (isNowActive && isBackgroundedRef.current) {
        isBackgroundedRef.current = false;
        dispatch(recordSessionEventThunk({ sessionId, type: 'foregrounded' }));
      }
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [sessionId, isSessionActive, dispatch]);
}
