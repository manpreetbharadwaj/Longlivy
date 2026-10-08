import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { WeightEntry } from './models';
import { weightRepository } from './repository/MockWeightRepository';
import { selectCurrentUserId } from '@/features/auth/selectors';
import type { RootState } from '@/store/store';

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
