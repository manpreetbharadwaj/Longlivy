import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

export const selectAllGoals = (state: RootState) => state.goals.goals;
export const selectActiveGoals = createSelector(selectAllGoals, (goals) => goals.filter((g) => g.active));
export const selectGoalsStatus = (state: RootState) => state.goals.status;
export const selectGoalsError = (state: RootState) => state.goals.error;
export const selectGoalsMutationStatus = (state: RootState) => state.goals.mutationStatus;
export const selectGoalsMutationError = (state: RootState) => state.goals.mutationError;
export const selectGoalProgress = (state: RootState, goalId: string) => state.goals.progress[goalId] ?? [];
export const selectGoalProgressStatus = (state: RootState, goalId: string) => state.goals.progressStatus[goalId] ?? 'idle';
export const selectGoalProgressError = (state: RootState, goalId: string) => state.goals.progressError[goalId] ?? null;
