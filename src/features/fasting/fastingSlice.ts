import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FastingMethodId, FastingSession } from './models';
import { FastingService } from './services/FastingService';
import { fastingRepository } from './repository/MockFastingRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';

const fastingService = new FastingService(fastingRepository);

interface FastingState {
  activeFast: FastingSession | null;
  history: FastingSession[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FastingState = {
  activeFast: null,
  history: [],
  status: 'idle',
  actionStatus: 'idle',
  error: null,
};

export const loadFastingData = createAsyncThunk('fasting/loadFastingData', async () => {
  const [active, history] = await Promise.all([
    fastingService.getActiveFast(DEMO_USER_ID),
    fastingService.getHistory(DEMO_USER_ID),
  ]);
  return { active, history };
});

export const startFastThunk = createAsyncThunk(
  'fasting/startFast',
  async (input: { method: FastingMethodId; customHours?: number }) =>
    fastingService.startFast(DEMO_USER_ID, input.method, input.customHours)
);

export const endFastThunk = createAsyncThunk('fasting/endFast', async (session: FastingSession) =>
  fastingService.endFastNow(session)
);

export const extendFastThunk = createAsyncThunk(
  'fasting/extendFast',
  async (input: { sessionId: string; additionalHours: number; currentPlannedEnd: string }) =>
    fastingService.extendFast(input.sessionId, input.additionalHours, input.currentPlannedEnd)
);

export const cancelFastThunk = createAsyncThunk('fasting/cancelFast', async (sessionId: string) =>
  fastingService.cancelFast(sessionId)
);

const fastingSlice = createSlice({
  name: 'fasting',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFastingData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadFastingData.fulfilled, (state, action: PayloadAction<{ active: FastingSession | null; history: FastingSession[] }>) => {
        state.status = 'succeeded';
        state.activeFast = action.payload.active;
        state.history = action.payload.history;
      })
      .addCase(loadFastingData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load fasting data';
      })
      .addCase(startFastThunk.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(startFastThunk.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.activeFast = action.payload;
      })
      .addCase(startFastThunk.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message ?? 'Failed to start fast';
      })
      .addCase(endFastThunk.fulfilled, (state, action) => {
        state.activeFast = null;
        state.history = [action.payload, ...state.history];
      })
      .addCase(extendFastThunk.fulfilled, (state, action) => {
        state.activeFast = action.payload;
      })
      .addCase(cancelFastThunk.fulfilled, (state, action) => {
        state.activeFast = null;
        state.history = [action.payload, ...state.history];
      });
  },
});

export default fastingSlice.reducer;
