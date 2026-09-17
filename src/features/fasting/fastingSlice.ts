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
  /**
   * Bumped by every action that actually changes `activeFast` (start/end/
   * extend/cancel). `loadFastingData` is a plain read that can be in flight
   * for a while (this screen and the dashboard both trigger it on mount) —
   * it records this value when it *starts* reading and only applies its
   * `active` result if nothing else has changed `activeFast` in the
   * meantime. Without this, a slow, stale load can resolve after (say) an
   * end-fast action and silently overwrite the `null` it just set, making
   * an already-ended fast reappear as active with no user action at all.
   */
  mutationSeq: number;
}

const initialState: FastingState = {
  activeFast: null,
  history: [],
  status: 'idle',
  actionStatus: 'idle',
  error: null,
  mutationSeq: 0,
};

// Narrow, local view of the state this slice's thunks need via `getState()`
// — avoids importing the app-wide `RootState` here, which would create a
// circular import (store.ts -> this slice -> store.ts).
type FastingThunkApi = { state: { fasting: FastingState } };

export const loadFastingData = createAsyncThunk<
  { active: FastingSession | null; history: FastingSession[]; seqAtStart: number },
  void,
  FastingThunkApi
>('fasting/loadFastingData', async (_, { getState }) => {
  const seqAtStart = getState().fasting.mutationSeq;
  const [active, history] = await Promise.all([
    fastingService.getActiveFast(DEMO_USER_ID),
    fastingService.getHistory(DEMO_USER_ID),
  ]);
  return { active, history, seqAtStart };
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
      .addCase(loadFastingData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload.history;
        // See `mutationSeq`'s doc comment: only apply `active` if nothing
        // else changed the active-fast state while this load was reading.
        if (action.payload.seqAtStart === state.mutationSeq) {
          state.activeFast = action.payload.active;
        }
      })
      .addCase(loadFastingData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load fasting data';
      })
      .addCase(startFastThunk.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(startFastThunk.fulfilled, (state, action: PayloadAction<{ session: FastingSession; alreadyActive: boolean }>) => {
        state.actionStatus = 'succeeded';
        state.activeFast = action.payload.session;
        state.mutationSeq += 1;
      })
      .addCase(startFastThunk.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message ?? 'Failed to start fast';
      })
      .addCase(endFastThunk.fulfilled, (state, action) => {
        state.activeFast = null;
        state.history = [action.payload, ...state.history];
        state.mutationSeq += 1;
      })
      .addCase(extendFastThunk.fulfilled, (state, action) => {
        state.activeFast = action.payload;
        state.mutationSeq += 1;
      })
      .addCase(cancelFastThunk.fulfilled, (state, action) => {
        state.activeFast = null;
        state.history = [action.payload, ...state.history];
        state.mutationSeq += 1;
      });
  },
});

export default fastingSlice.reducer;
