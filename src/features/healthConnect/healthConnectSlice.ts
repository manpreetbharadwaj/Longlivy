import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  checkAvailability,
  ensureInitialized,
  hasAllRequiredPermissions,
  requestAllPermissions,
  getCurrentPermissions,
  fetchAllMetrics,
  fetchDebugInfo,
  openSettings,
} from './healthConnectService';
import {
  HealthConnectStatus,
  HealthConnectMetrics,
  HealthConnectDebugInfo,
  createEmptyHealthConnectMetrics,
  createEmptyDebugInfo,
  latestRecordedAt,
  diffNewDataFields,
} from './models';

type RefreshStatus = 'idle' | 'refreshing' | 'success' | 'error';

interface HealthConnectState {
  status: HealthConnectStatus;
  hasAllPermissions: boolean;
  /** recordType strings ('Steps', 'HeartRate', ...) currently granted read access — powers the per-metric checkmarks in the Health Connect Debug section. */
  grantedRecordTypes: string[];
  metrics: HealthConnectMetrics;
  debugInfo: HealthConnectDebugInfo;
  refreshStatus: RefreshStatus;
  /** Every time HealthyMe actually asked Health Connect for data — advances even if nothing new came back. */
  lastCheckedAt: string | null;
  /** The most recent `recordedAt` across every populated metric — when the freshest data we have was actually measured, not when we last checked. */
  lastDataReceivedAt: string | null;
  /** Field keys whose recordedAt advanced (or went from unavailable to available) on the most recent refresh — drives the "New data received" banner. Cleared at the start of the next refresh. */
  newDataFieldKeys: (keyof HealthConnectMetrics)[];
  errorMessage: string | null;
}

const initialState: HealthConnectState = {
  status: 'checking',
  hasAllPermissions: false,
  grantedRecordTypes: [],
  metrics: createEmptyHealthConnectMetrics(),
  debugInfo: createEmptyDebugInfo(),
  refreshStatus: 'idle',
  lastCheckedAt: null,
  lastDataReceivedAt: null,
  newDataFieldKeys: [],
  errorMessage: null,
};

const healthConnectSlice = createSlice({
  name: 'healthConnect',
  initialState,
  reducers: {
    statusSet(state, action: PayloadAction<HealthConnectStatus>) {
      state.status = action.payload;
      if (action.payload !== 'error') state.errorMessage = null;
    },
    permissionsChecked(state, action: PayloadAction<boolean>) {
      state.hasAllPermissions = action.payload;
      if (!action.payload && state.status === 'ready') state.status = 'permission_required';
    },
    grantedRecordTypesSet(state, action: PayloadAction<string[]>) {
      state.grantedRecordTypes = action.payload;
    },
    refreshStarted(state) {
      state.refreshStatus = 'refreshing';
    },
    refreshSucceeded(state, action: PayloadAction<{ metrics: HealthConnectMetrics; debugInfo: HealthConnectDebugInfo }>) {
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

export const healthConnectActions = healthConnectSlice.actions;
export default healthConnectSlice.reducer;

/**
 * The one entry point for both "load the screen" and "Refresh Health Data" —
 * this means "re-check Health Connect state and re-read its records", NEVER
 * a BLE command to the watch and NEVER a request for NoiseFit/Google Fit to
 * sync (no supported API exists for that — see healthConnectService.ts).
 * Also what re-runs when the app returns from Android's Health Connect
 * settings/permission screen, since permissions may have changed there.
 */
export const refreshHealthConnectThunk = createAsyncThunk('healthConnect/refresh', async (_, { dispatch }) => {
  try {
    const availability = await checkAvailability();
    if (availability !== 'available') {
      dispatch(healthConnectActions.statusSet(availability === 'update_required' ? 'update_required' : 'unavailable'));
      return;
    }
    await ensureInitialized();

    const grantedPermissions = await getCurrentPermissions();
    dispatch(healthConnectActions.grantedRecordTypesSet(grantedPermissions.map((p) => p.recordType)));
    const granted = await hasAllRequiredPermissions();
    dispatch(healthConnectActions.permissionsChecked(granted));
    if (!granted) {
      dispatch(healthConnectActions.statusSet('permission_required'));
      return;
    }

    dispatch(healthConnectActions.refreshStarted());
    const [metrics, debugInfo] = await Promise.all([fetchAllMetrics(), fetchDebugInfo()]);
    dispatch(healthConnectActions.refreshSucceeded({ metrics, debugInfo }));
  } catch (error) {
    dispatch(healthConnectActions.refreshFailed(error instanceof Error ? error.message : 'health_connect_refresh_failed'));
  }
});

export const requestHealthConnectPermissionsThunk = createAsyncThunk('healthConnect/requestPermissions', async (_, { dispatch }) => {
  await requestAllPermissions();
  const granted = await hasAllRequiredPermissions();
  dispatch(healthConnectActions.permissionsChecked(granted));
  if (granted) dispatch(refreshHealthConnectThunk());
  else dispatch(healthConnectActions.statusSet('permission_required'));
});

export const openHealthConnectSettingsThunk = createAsyncThunk('healthConnect/openSettings', async () => {
  openSettings();
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type HealthConnectThunkApi = { state: { healthConnect: ReturnType<typeof healthConnectSlice.reducer> } };

/**
 * Used specifically when HealthyMe comes back to foreground after the user
 * tapped "Open NoiseFit" — NoiseFit's own sync, then Google Fit, then
 * Health Connect all need a moment to settle, and there's no event to tell
 * us when that's done. A bounded 3-attempt retry (now, +2.5s, +5s more) is
 * the honest middle ground between a single too-early refresh and
 * continuously polling, which point 12 of the spec explicitly forbids.
 * Stops as soon as lastDataReceivedAt actually advances.
 */
export const refreshWithBoundedRetryThunk = createAsyncThunk<void, void, HealthConnectThunkApi>(
  'healthConnect/refreshWithBoundedRetry',
  async (_, { dispatch, getState }) => {
    const startedFrom = getState().healthConnect.lastDataReceivedAt;
    const delays = [0, 2500, 5000];
    for (const ms of delays) {
      if (ms > 0) await delay(ms);
      await dispatch(refreshHealthConnectThunk());
      if (getState().healthConnect.lastDataReceivedAt !== startedFrom) return;
    }
  }
);
