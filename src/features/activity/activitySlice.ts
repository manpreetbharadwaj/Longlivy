import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Activity, ActivityType } from './models';
import { activityRepository } from './repository/MockActivityRepository';
import { ActivityTrackingSnapshot, EndActivityGpsSnapshot } from './repository/ActivityRepository';
import { selectCurrentUserId } from '@/features/auth/selectors';
import type { RootState } from '@/store/store';

interface ActivityState {
  activeActivity: Activity | null;
  history: Activity[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  actionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ActivityState = {
  activeActivity: null,
  history: [],
  status: 'idle',
  actionStatus: 'idle',
};

export const loadActivityData = createAsyncThunk('activity/loadActivityData', async (_: void, { getState }) => {
  const userId = selectCurrentUserId(getState() as RootState);
  const [active, history] = await Promise.all([
    activityRepository.getActiveActivity(userId),
    activityRepository.getHistory(userId),
  ]);
  return { active, history };
});

export const startActivityThunk = createAsyncThunk(
  'activity/start',
  async (input: { type: ActivityType; gpsAvailable: boolean; startedAt?: string; weightKg?: number | null }, { getState }) =>
    activityRepository.startActivity(selectCurrentUserId(getState() as RootState), input.type, input.gpsAvailable, {
      startedAt: input.startedAt,
      weightKg: input.weightKg,
    })
);

export const pauseActivityThunk = createAsyncThunk(
  'activity/pause',
  async (input: { id: string; snapshot?: ActivityTrackingSnapshot }) => activityRepository.pauseActivity(input.id, { snapshot: input.snapshot })
);

export const resumeActivityThunk = createAsyncThunk('activity/resume', async (id: string) =>
  activityRepository.resumeActivity(id)
);

export const updateActivityTrackingSnapshotThunk = createAsyncThunk(
  'activity/updateTrackingSnapshot',
  async (input: { id: string; snapshot: ActivityTrackingSnapshot }) => activityRepository.updateTrackingSnapshot(input.id, input.snapshot)
);

export const endActivityThunk = createAsyncThunk(
  'activity/end',
  async (input: { id: string; weightKg?: number | null; gps?: EndActivityGpsSnapshot }) =>
    activityRepository.endActivity(input.id, { weightKg: input.weightKg, gps: input.gps })
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadActivityData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadActivityData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activeActivity = action.payload.active;
        state.history = action.payload.history;
      })
      .addCase(loadActivityData.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(startActivityThunk.fulfilled, (state, action) => {
        state.activeActivity = action.payload;
      })
      .addCase(pauseActivityThunk.fulfilled, (state, action) => {
        state.activeActivity = action.payload;
      })
      .addCase(resumeActivityThunk.fulfilled, (state, action) => {
        state.activeActivity = action.payload;
      })
      .addCase(updateActivityTrackingSnapshotThunk.fulfilled, (state, action) => {
        if (state.activeActivity?.id === action.payload.id) state.activeActivity = action.payload;
      })
      .addCase(endActivityThunk.fulfilled, (state, action) => {
        state.activeActivity = null;
        state.history = [action.payload, ...state.history];
      });
  },
});

export default activitySlice.reducer;
