import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Activity, ActivityType } from './models';
import { activityRepository } from './repository/MockActivityRepository';
import { EndActivityGpsSnapshot } from './repository/ActivityRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { DEMO_USER } from '@/mock/demoUser';

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

export const loadActivityData = createAsyncThunk('activity/loadActivityData', async () => {
  const [active, history] = await Promise.all([
    activityRepository.getActiveActivity(DEMO_USER_ID),
    activityRepository.getHistory(DEMO_USER_ID),
  ]);
  return { active, history };
});

export const startActivityThunk = createAsyncThunk(
  'activity/start',
  async (input: { type: ActivityType; gpsAvailable: boolean }) =>
    activityRepository.startActivity(DEMO_USER_ID, input.type, input.gpsAvailable)
);

export const pauseActivityThunk = createAsyncThunk('activity/pause', async (id: string) =>
  activityRepository.pauseActivity(id)
);

export const resumeActivityThunk = createAsyncThunk('activity/resume', async (id: string) =>
  activityRepository.resumeActivity(id)
);

export const endActivityThunk = createAsyncThunk(
  'activity/end',
  async (input: { id: string; gps?: EndActivityGpsSnapshot }) =>
    activityRepository.endActivity(input.id, { weightKg: DEMO_USER.weightKg, gps: input.gps })
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
      .addCase(endActivityThunk.fulfilled, (state, action) => {
        state.activeActivity = null;
        state.history = [action.payload, ...state.history];
      });
  },
});

export default activitySlice.reducer;
