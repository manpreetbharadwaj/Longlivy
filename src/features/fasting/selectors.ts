import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { calculateFastingProgress } from './services/FastingCalculator';
import { scheduleFromPlan } from './services/fastingPlanSchedule';

export const selectActiveFast = (state: RootState) => state.fasting.activeFast;
export const selectFastingHistory = (state: RootState) => state.fasting.history;
export const selectFastingStatus = (state: RootState) => state.fasting.status;
export const selectFastingActionStatus = (state: RootState) => state.fasting.actionStatus;
export const selectFastingPlan = (state: RootState) => state.fasting.plan;

/** The schedule the live timer follows, read from the active plan. Null when there is no plan, or it can't be read as a valid schedule. */
export const selectActiveSchedule = createSelector(selectFastingPlan, (plan) => (plan ? scheduleFromPlan(plan) : null));

/**
 * The most recent finished fast, if it ran to completion - what keeps the eating window that follows it on screen once it has left the
 * active slot. Only the newest session counts: a fast ended early (or cancelled) after an older completed one means the user is no
 * longer in that older fast's eating window.
 */
export const selectLastCompletedFast = createSelector(selectFastingHistory, (history) => (history[0]?.status === 'completed' ? history[0] : null));

/**
 * NOTE: this selector is deliberately NOT re-derived every second. Components
 * that render a live countdown should call calculateFastingProgress() inside
 * their own local render loop (see useFastingCycle), not through Redux state.
 */
export const selectActiveFastStaticProgress = createSelector(selectActiveFast, (activeFast) => {
  if (!activeFast) return null;
  return calculateFastingProgress(activeFast.startTimestamp, activeFast.plannedEndTimestamp);
});

const selectFastingSummary = (state: RootState) => state.insights.fastingSummary;
const selectServerFastingStreak = (state: RootState) => state.insights.fastingStreak;
const HOUR_MS = 3_600_000;

/** API mode: totals, average, longest and streak come from GET /fasting/summary + /streaks (server rules). Shortest is only known locally. */
export const selectFastingStats = createSelector(selectFastingHistory, selectFastingSummary, selectServerFastingStreak, (history, summary, serverStreak) => {
  const local = localFastingStats(history);
  if (!summary) return serverStreak == null ? local : { ...local, currentStreak: serverStreak };
  return {
    ...local,
    totalSessions: summary.total,
    completedSessions: summary.completed,
    prematureSessions: summary.failed,
    averageDurationMs: summary.averageHours * HOUR_MS,
    longestDurationMs: summary.longestHours * HOUR_MS,
    currentStreak: serverStreak ?? summary.currentStreak,
  };
});

function localFastingStats(history: ReturnType<typeof selectFastingHistory>) {
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
}
