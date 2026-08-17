import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { calculateFastingProgress } from './services/FastingCalculator';

export const selectActiveFast = (state: RootState) => state.fasting.activeFast;
export const selectFastingHistory = (state: RootState) => state.fasting.history;
export const selectFastingStatus = (state: RootState) => state.fasting.status;
export const selectFastingActionStatus = (state: RootState) => state.fasting.actionStatus;

/**
 * NOTE: this selector is deliberately NOT re-derived every second. Components
 * that render a live countdown should call calculateFastingProgress() inside
 * their own local render loop (see useFastingTimer), not through Redux state.
 */
export const selectActiveFastStaticProgress = createSelector(selectActiveFast, (activeFast) => {
  if (!activeFast) return null;
  return calculateFastingProgress(activeFast.startTimestamp, activeFast.plannedEndTimestamp);
});

export const selectFastingStats = createSelector(selectFastingHistory, (history) => {
  const completed = history.filter((h) => h.status === 'completed');
  const durations = completed.map((h) => h.actualDuration ?? 0);
  const totalMs = durations.reduce((sum, d) => sum + d, 0);
  const avgMs = durations.length ? totalMs / durations.length : 0;
  const longest = durations.length ? Math.max(...durations) : 0;
  const shortest = durations.length ? Math.min(...durations) : 0;

  let currentStreak = 0;
  for (const session of history) {
    if (session.status === 'completed') currentStreak += 1;
    else break;
  }

  return {
    totalSessions: history.length,
    completedSessions: completed.length,
    prematureSessions: history.filter((h) => h.status === 'ended_prematurely').length,
    averageDurationMs: avgMs,
    longestDurationMs: longest,
    shortestDurationMs: shortest,
    currentStreak,
  };
});
