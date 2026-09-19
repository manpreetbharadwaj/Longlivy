import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { checkAvailability, hasRequestedPermissions, requestAllPermissions, getAuthorizationStatuses, fetchAllMetrics, fetchDebugInfo } from './healthKitService';
import { HealthKitStatus, HealthKitMetrics, HealthKitDebugInfo, createEmptyHealthKitMetrics, createEmptyHealthKitDebugInfo, latestRecordedAt, diffNewDataFields } from './models';

type RefreshStatus = 'idle' | 'refreshing' | 'success' | 'error';

interface HealthKitState {
  status: HealthKitStatus;
  hasRequestedPermissions: boolean;
  /** identifier -> 'authorized' | 'not_authorized' | 'unknown', straight from authorizationStatusFor. */
  authorizationStatuses: Record<string, 'authorized' | 'not_authorized' | 'unknown'>;
  metrics: HealthKitMetrics;
  debugInfo: HealthKitDebugInfo;
  refreshStatus: RefreshStatus;
  lastCheckedAt: string | null;
  lastDataReceivedAt: string | null;
  newDataFieldKeys: (keyof HealthKitMetrics)[];
  errorMessage: string | null;
}

const initialState: HealthKitState = {
  status: 'checking',
  hasRequestedPermissions: false,
  authorizationStatuses: {},
  metrics: createEmptyHealthKitMetrics(),
  debugInfo: createEmptyHealthKitDebugInfo(),
  refreshStatus: 'idle',
  lastCheckedAt: null,
  lastDataReceivedAt: null,
  newDataFieldKeys: [],
  errorMessage: null,
};

const healthKitSlice = createSlice({
  name: 'healthKit',
  initialState,
  reducers: {
    statusSet(state, action: PayloadAction<HealthKitStatus>) {
      state.status = action.payload;
      if (action.payload !== 'error') state.errorMessage = null;
    },
    permissionsChecked(state, action: PayloadAction<{ hasRequested: boolean; authorizationStatuses: Record<string, 'authorized' | 'not_authorized' | 'unknown'> }>) {
      state.hasRequestedPermissions = action.payload.hasRequested;
      state.authorizationStatuses = action.payload.authorizationStatuses;
    },
    refreshStarted(state) {
      state.refreshStatus = 'refreshing';
    },
    refreshSucceeded(state, action: PayloadAction<{ metrics: HealthKitMetrics; debugInfo: HealthKitDebugInfo }>) {
      const newDataFieldKeys = diffNewDataFields(state.refreshStatus === 'idle' ? null : state.metrics, action.payload.metrics);
      state.refreshStatus = 'success';
      state.metrics = action.payload.metrics;
      state.debugInfo = action.payload.debugInfo;
      state.newDataFieldKeys = newDataFieldKeys;
      state.lastCheckedAt = new Date().toISOString();
      state.lastDataReceivedAt = latestRecordedAt(action.payload.metrics);
      state.status = 'ready';
      state.errorMessage = null;
    },
    refreshFailed(state, action: PayloadAction<string>) {
      state.refreshStatus = 'error';
      state.status = 'error';
      state.errorMessage = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const healthKitActions = healthKitSlice.actions;
export default healthKitSlice.reducer;

/**
 * Entry point for both "load the screen" and "Refresh Health Data" — never
 * a claim that the Apple Watch itself synchronizes; this only re-reads
 * whatever is already in Apple Health via HealthKit.
 */
export const refreshHealthKitThunk = createAsyncThunk('healthKit/refresh', async (_, { dispatch }) => {
  try {
    const availability = await checkAvailability();
    if (availability !== 'available') {
      dispatch(healthKitActions.statusSet('unavailable'));
      return;
    }

    const hasRequested = await hasRequestedPermissions();
    const authorizationStatuses = getAuthorizationStatuses();
    dispatch(healthKitActions.permissionsChecked({ hasRequested, authorizationStatuses }));
    if (!hasRequested) {
      dispatch(healthKitActions.statusSet('permission_required'));
      return;
    }

    dispatch(healthKitActions.refreshStarted());
    const [metrics, debugInfo] = await Promise.all([fetchAllMetrics(), fetchDebugInfo()]);
    dispatch(healthKitActions.refreshSucceeded({ metrics, debugInfo }));
  } catch (error) {
    dispatch(healthKitActions.refreshFailed(error instanceof Error ? error.message : 'healthkit_refresh_failed'));
  }
});

export const requestHealthKitPermissionsThunk = createAsyncThunk('healthKit/requestPermissions', async (_, { dispatch }) => {
  await requestAllPermissions();
  dispatch(refreshHealthKitThunk());
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type HealthKitThunkApi = { state: { healthKit: ReturnType<typeof healthKitSlice.reducer> } };

/**
 * Used when LongLivy returns to foreground after the user visited Apple
 * Health or another health app — a bounded 3-attempt retry (now, +2.5s,
 * +5s more), stopping early once lastDataReceivedAt actually advances.
 * Never a continuous poll.
 */
export const refreshWithBoundedRetryThunk = createAsyncThunk<void, void, HealthKitThunkApi>('healthKit/refreshWithBoundedRetry', async (_, { dispatch, getState }) => {
  const startedFrom = getState().healthKit.lastDataReceivedAt;
  const delays = [0, 2500, 5000];
  for (const ms of delays) {
    if (ms > 0) await delay(ms);
    await dispatch(refreshHealthKitThunk());
    if (getState().healthKit.lastDataReceivedAt !== startedFrom) return;
  }
});
