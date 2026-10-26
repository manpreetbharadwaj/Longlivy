import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { WeightEntry } from './models';
import { weightRepository } from './repository/MockWeightRepository';
import { selectCurrentUserId } from '@/features/auth/selectors';
import type { RootState } from '@/store/store';
import { selectCurrentWeight } from './selectors';
import { saveProfileChangesThunk } from '@/features/profile/profileThunks';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile } from '@/features/calories/calorieSlice';
import { loadNutritionTargetsThunk } from '@/features/nutrition/nutritionSlice';
import { env } from '@/config/env';

interface WeightState {
  history: WeightEntry[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: WeightState = { history: [], status: 'idle' };

export const loadWeightHistory = createAsyncThunk<WeightEntry[], void, { state: RootState }>('weight/loadHistory', async (_, { getState }) =>
  weightRepository.getHistory(selectCurrentUserId(getState()))
);

export const logWeightThunk = createAsyncThunk<WeightEntry, number, { state: RootState }>('weight/logWeight', async (weightKg, { getState }) =>
  weightRepository.logWeight(selectCurrentUserId(getState()), weightKg)
);

export const updateWeightThunk = createAsyncThunk('weight/update', async (input: { id: string; weightKg: number }) =>
  weightRepository.updateEntry(input.id, input.weightKg)
);

export const deleteWeightThunk = createAsyncThunk('weight/delete', async (id: string) => {
  await weightRepository.deleteEntry(id);
  return id;
});

/**
 * The server copies the newest weight log into `profile.current_weight` on
 * create/update/delete (verified 2026-10-19) but does not recalculate
 * nutrition targets. So in API mode the app mirrors the new weight locally and
 * asks for a recalculation (auto targets only); mock mode, which has no
 * server, saves the profile change itself.
 */
export const syncProfileWeightThunk = createAsyncThunk<void, void, { state: RootState }>('weight/syncProfile', async (_, { getState, dispatch }) => {
  const latest = selectCurrentWeight(getState());
  const profileWeight = getState().profile.profile.weightKg;
  if (!latest || (profileWeight != null && Math.abs(latest.weightKg - profileWeight) < 0.05)) return;
  if (env.useMockApi) {
    await dispatch(saveProfileChangesThunk({ weightKg: latest.weightKg }));
    return;
  }
  dispatch(updateProfile({ weightKg: latest.weightKg }));
  dispatch(setBodyProfile({ weightKg: latest.weightKg }));
  if (getState().calorie.calorieGoalSource === 'auto') await dispatch(loadNutritionTargetsThunk({ recalculate: true }));
});

const weightSlice = createSlice({
  name: 'weight',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadWeightHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadWeightHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload;
      })
      .addCase(loadWeightHistory.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(logWeightThunk.fulfilled, (state, action) => {
        state.history.push(action.payload);
      })
      .addCase(updateWeightThunk.fulfilled, (state, action) => {
        state.history = state.history.map((w) => (w.id === action.payload.id ? action.payload : w));
      })
      .addCase(deleteWeightThunk.fulfilled, (state, action) => {
        state.history = state.history.filter((w) => w.id !== action.payload);
      });
  },
});

export default weightSlice.reducer;
