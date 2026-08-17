import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export const selectActiveActivity = (state: RootState) => state.activity.activeActivity;
export const selectActivityHistory = (state: RootState) => state.activity.history;
export const selectActivityStatus = (state: RootState) => state.activity.status;

export const selectTodayActivityCalories = createSelector(selectActivityHistory, (history) => {
  const today = new Date().toDateString();
  return history
    .filter((a) => new Date(a.startTimestamp).toDateString() === today)
    .reduce((sum, a) => sum + (a.calories ?? 0), 0);
});

export const selectActivityStats = createSelector(selectActivityHistory, (history) => ({
  totalActivities: history.length,
  totalDistanceMeters: history.reduce((s, a) => s + (a.distanceMeters ?? 0), 0),
  totalCalories: history.reduce((s, a) => s + (a.calories ?? 0), 0),
  totalDurationMs: history.reduce((s, a) => s + a.activeDuration, 0),
}));
