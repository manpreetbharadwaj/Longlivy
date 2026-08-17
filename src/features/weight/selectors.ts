import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export const selectWeightHistory = (state: RootState) => state.weight.history;

export const selectCurrentWeight = createSelector(selectWeightHistory, (history) =>
  history.length ? history[history.length - 1] : null
);

export const selectWeightTrend = createSelector(selectWeightHistory, (history) => {
  if (history.length < 2) return 0;
  const first = history[0].weightKg;
  const last = history[history.length - 1].weightKg;
  return Math.round((last - first) * 10) / 10;
});
