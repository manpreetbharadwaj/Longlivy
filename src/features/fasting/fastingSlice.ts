import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { FastingPlan, FastingSession } from './models';
import { FastingService, ScheduleRequest } from './services/FastingService';
import { fastingRepository } from './repository/MockFastingRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';

const fastingService = new FastingService(fastingRepository);

interface FastingState {
  activeFast: FastingSession | null;
  /** The saved schedule the timer follows (the one active plan). Null until the user has chosen a daily model. */
  plan: FastingPlan | null;
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
  plan: null,
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
  { active: FastingSession | null; history: FastingSession[]; plan: FastingPlan | null; seqAtStart: number },
  void,
  FastingThunkApi
>('fasting/loadFastingData', async (_, { getState }) => {
  const seqAtStart = getState().fasting.mutationSeq;
  // Read sequentially: getActiveFast settles a fast that reached its planned
  // end, and the history and plan must be read after that has happened.
  const active = await fastingService.getActiveFast(DEMO_USER_ID);
  const [history, plan] = await Promise.all([fastingService.getHistory(DEMO_USER_ID), fastingService.getActivePlan(DEMO_USER_ID)]);
  return { active, history, plan, seqAtStart };
});

export const startFastThunk = createAsyncThunk('fasting/startFast', async (input: ScheduleRequest) => fastingService.startFast(DEMO_USER_ID, input));

export const saveFastingScheduleThunk = createAsyncThunk(
  'fasting/saveSchedule',
  async (input: ScheduleRequest & { applyToCurrent: boolean }) =>
    fastingService.saveSchedule(DEMO_USER_ID, { methodId: input.methodId, schedule: input.schedule }, { applyToCurrent: input.applyToCurrent })
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
        state.plan = action.payload.plan;
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
      .addCase(startFastThunk.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.activeFast = action.payload.session ?? state.activeFast;
        state.plan = action.payload.plan ?? state.plan;
        state.mutationSeq += 1;
      })
      .addCase(startFastThunk.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message ?? 'Failed to start fast';
      })
      .addCase(saveFastingScheduleThunk.pending, (state) => {
        state.actionStatus = 'loading';
      })
      .addCase(saveFastingScheduleThunk.fulfilled, (state, action) => {
        state.actionStatus = 'succeeded';
        state.plan = action.payload.plan ?? state.plan;
        state.activeFast = action.payload.session ?? state.activeFast;
        state.mutationSeq += 1;
      })
      .addCase(saveFastingScheduleThunk.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.error.message ?? 'Failed to save the schedule';
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
