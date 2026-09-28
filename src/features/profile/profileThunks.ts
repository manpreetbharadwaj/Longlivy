import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import type { DemoUserProfile } from '@/mock/demoUser';
import { updateProfile } from './profileSlice';
import { setBodyProfile, setCalorieGoal } from '@/features/calories/calorieSlice';
import { calculateAutoCalorieTarget, paceAfterGoalChange } from '@/features/calories/services/calorieTarget';

/**
 * Saves edits to the profile and brings everything derived from it up to date
 * in one step: the persisted profile, the body profile the energy calculations
 * read (BMR/NRLA), and - when the target is auto-calculated rather than typed
 * in - the daily calorie target. Activity level and goal both feed that target,
 * so changing either here changes the Nutrition screen's numbers too.
 */
export const saveProfileChangesThunk = createAsyncThunk<void, Partial<DemoUserProfile>, { state: RootState }>('profile/saveChanges', async (changes, { dispatch, getState }) => {
  const before = getState().profile.profile;
  const merged: DemoUserProfile = { ...before, ...changes };
  const pace = paceAfterGoalChange(before.goal, merged.goal, before.weightChangePaceKgPerWeek);

  dispatch(updateProfile({ ...changes, weightChangePaceKgPerWeek: pace }));

  const state = getState();
  const body = { ...state.calorie.bodyProfile, heightCm: merged.heightCm, weightKg: merged.weightKg, activityLevel: merged.activityLevel };
  dispatch(setBodyProfile(body));

  if (state.calorie.calorieGoalSource === 'auto') {
    const target = calculateAutoCalorieTarget(body, merged.goal, pace);
    dispatch(setCalorieGoal({ calories: target.calories, source: 'auto', calculationMethod: target.method, calculationVersion: target.version }));
  }
});
