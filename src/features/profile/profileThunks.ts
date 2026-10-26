import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import type { DemoUserProfile } from '@/mock/demoUser';
import { updateProfile } from './profileSlice';
import { setBodyProfile, setCalorieGoal } from '@/features/calories/calorieSlice';
import { calculateAutoCalorieTarget, paceAfterGoalChange } from '@/features/calories/services/calorieTarget';
import { env } from '@/config/env';
import { profileApi, toServerActivityLevel, UpdateProfileInput } from '@/services/api/profileApi';
import { loadNutritionTargetsThunk } from '@/features/nutrition/nutritionSlice';
import { ageFromDateOfBirth } from '@/features/onboarding/OnboardingContext';

/**
 * Sends only explicitly changed profile fields to PUT /profile. Omitting
 * untouched values is important because every documented field is nullable:
 * a partial edit must never erase valid server data with accidental nulls.
 */
async function pushProfile(changes: Partial<DemoUserProfile>): Promise<void> {
  if (env.useMockApi) return;
  const wire: UpdateProfileInput = {};
  if (changes.firstName !== undefined) wire.firstName = changes.firstName;
  if (changes.lastName !== undefined) wire.lastName = changes.lastName;
  if (changes.dateOfBirth !== undefined) wire.dateOfBirth = changes.dateOfBirth;
  if (changes.gender !== undefined) wire.gender = changes.gender;
  if (changes.heightCm !== undefined && Number.isFinite(changes.heightCm)) wire.heightCm = changes.heightCm;
  if (changes.weightKg !== undefined && Number.isFinite(changes.weightKg)) wire.weightKg = changes.weightKg;
  if (changes.address !== undefined) wire.address = changes.address;
  if (changes.activityLevel !== undefined) wire.activityLevel = toServerActivityLevel(changes.activityLevel);
  if (changes.goal !== undefined) wire.goal = changes.goal;
  if (changes.weightChangePaceKgPerWeek !== undefined) wire.weightChangePaceKgPerWeek = changes.weightChangePaceKgPerWeek;
  if (changes.trainingFrequency !== undefined) wire.trainingFrequency = changes.trainingFrequency;
  if (changes.trainingVolume !== undefined) wire.trainingVolume = changes.trainingVolume;
  if (changes.fastingMethod !== undefined) wire.fastingMethod = changes.fastingMethod;
  if (changes.micronutrientFocus !== undefined) wire.micronutrientFocus = changes.micronutrientFocus;
  if (changes.avatarId !== undefined) wire.avatarId = changes.avatarId;
  if (Object.keys(wire).length > 0) await profileApi.updateProfile(wire);
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Your changes could not be saved.');

/**
 * Saves edits to the profile and brings everything derived from it up to date
 * in one step: the server profile, the persisted local profile, the body
 * profile the energy calculations read (BMR/NRLA), and - when the target is
 * auto-calculated rather than typed in - the daily calorie target. Nothing
 * local changes if the server rejects the edit.
 */
export const saveProfileChangesThunk = createAsyncThunk<void, Partial<DemoUserProfile>, { state: RootState; rejectValue: string }>(
  'profile/saveChanges',
  async (changes, { dispatch, getState, rejectWithValue }) => {
    try {
      await pushProfile(changes);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
    const before = getState().profile.profile;
    const merged: DemoUserProfile = { ...before, ...changes };
    const pace = paceAfterGoalChange(before.goal, merged.goal, before.weightChangePaceKgPerWeek);
    dispatch(updateProfile({ ...changes, ...(changes.goal !== undefined ? { goalSource: 'user' as const } : {}), weightChangePaceKgPerWeek: pace }));
    const state = getState();
    const body = {
      ...state.calorie.bodyProfile,
      heightCm: merged.heightCm ?? state.calorie.bodyProfile.heightCm,
      weightKg: merged.weightKg ?? state.calorie.bodyProfile.weightKg,
      activityLevel: merged.activityLevel,
      gender: merged.gender ?? state.calorie.bodyProfile.gender,
      age: merged.dateOfBirth ? ageFromDateOfBirth(merged.dateOfBirth) : state.calorie.bodyProfile.age,
    };
    dispatch(setBodyProfile(body));
    // Only recalculate when an input to the calculation changed. The server
    // keeps targets the user edited (`source: manual`, reported back as
    // `reason: manual_override`) and updates only the calculated ones.
    const inputsChanged = (['heightCm', 'weightKg', 'activityLevel', 'goal', 'dateOfBirth', 'gender'] as const).some(
      (key) => changes[key] !== undefined && changes[key] !== before[key],
    );
    if (!env.useMockApi && state.calorie.calorieGoalSource === 'auto') {
      if (inputsChanged) dispatch(loadNutritionTargetsThunk({ recalculate: true }));
    } else if (state.calorie.calorieGoalSource === 'auto') {
      const target = calculateAutoCalorieTarget(body, merged.goal, pace);
      dispatch(setCalorieGoal({ calories: target.calories, source: 'auto', calculationMethod: target.method, calculationVersion: target.version }));
    }
  },
);

/** The post-registration address step: persisted server-side before the app unlocks. */
export const saveAddressThunk = createAsyncThunk<void, string, { rejectValue: string }>('profile/saveAddress', async (address, { dispatch, rejectWithValue }) => {
  try {
    await pushProfile({ address });
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
  dispatch(updateProfile({ address }));
});
