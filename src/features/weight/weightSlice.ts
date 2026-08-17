import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { WeightEntry } from './models';
import { weightRepository } from './repository/MockWeightRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';

interface WeightState {
  history: WeightEntry[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: WeightState = { history: [], status: 'idle' };

export const loadWeightHistory = createAsyncThunk('weight/loadHistory', async () =>
  weightRepository.getHistory(DEMO_USER_ID)
);

export const logWeightThunk = createAsyncThunk('weight/logWeight', async (weightKg: number) =>
  weightRepository.logWeight(DEMO_USER_ID, weightKg)
);

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
      });
  },
});

export default weightSlice.reducer;
