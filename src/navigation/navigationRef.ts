import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/**
 * Lets code outside the component tree (the meditation-reminder notification
 * tap handler, see App.tsx) navigate imperatively. Nothing else in the app
 * needed this before Phase 6 — kept minimal and additive, not a general
 * deep-linking system.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Opens Meditation Home — the "minimum useful behavior" a reminder tap needs (Section 19); not a deep link into a specific session, which the current navigation architecture doesn't support without meaningfully more work. */
export function navigateToMeditationHome(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Main', { screen: 'MeditationTab', params: { screen: 'MeditationHome' } });
}
