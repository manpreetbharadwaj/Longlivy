import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export const selectAllGoals = (state: RootState) => state.goals.goals;
export const selectActiveGoals = createSelector(selectAllGoals, (goals) => goals.filter((g) => g.active));
