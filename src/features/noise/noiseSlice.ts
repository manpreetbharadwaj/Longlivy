import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { State } from 'react-native-ble-plx';
import { noiseBleService, NoiseBleCallbacks } from './ble/NoiseBleService';
import { noiseLog } from './ble/rawLogger';
import {
  NoiseConnectionState,
  NoiseDiscoveredDevice,
  NoiseServiceInfo,
  NoiseDeviceInfo,
  NoiseActivityMetrics,
  PacketStats,
  RawPacketLogEntry,
  SyncStatus,
  createEmptyDeviceInfo,
  createEmptyActivityMetrics,
} from './models';

const MAX_RAW_LOG_ENTRIES = 100;

interface NoiseState {
  connectionState: NoiseConnectionState;
  errorMessage: string | null;
  discoveredDevices: NoiseDiscoveredDevice[];
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  /** Preserved across disconnects (unlike connectedDeviceId, which clears) so a "Reconnect" shortcut can target the same watch without forcing the user back through a full scan — cleared only on reset(). */
  lastKnownDeviceId: string | null;
  lastKnownDeviceName: string | null;
  services: NoiseServiceInfo[];
  deviceInfo: NoiseDeviceInfo;
  activityMetrics: NoiseActivityMetrics;
  packetStats: PacketStats[];
  rawLog: RawPacketLogEntry[];
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  autoSyncEnabled: boolean;
}

const initialState: NoiseState = {
  connectionState: 'idle',
  errorMessage: null,
  discoveredDevices: [],
  connectedDeviceId: null,
  connectedDeviceName: null,
  lastKnownDeviceId: null,
  lastKnownDeviceName: null,
  services: [],
  deviceInfo: createEmptyDeviceInfo(),
  activityMetrics: createEmptyActivityMetrics(),
  packetStats: [],
  rawLog: [],
  syncStatus: 'idle',
  lastSyncedAt: null,
  syncError: null,
  autoSyncEnabled: true,
};

/** The data-update half of NoiseBleCallbacks — shared between connectNoiseDeviceThunk and syncNowThunk since both trigger real reads/notifications that flow through the same handlers. */
function buildDataCallbacks(dispatch: (action: unknown) => void): Pick<NoiseBleCallbacks, 'onRawPacket' | 'onDeviceInfoUpdate' | 'onActivityMetricsUpdate' | 'onPacketStatsUpdate'> {
  return {
    onRawPacket: (entry) => dispatch(noiseActions.rawPacketReceived(entry)),
    onDeviceInfoUpdate: (info) => dispatch(noiseActions.deviceInfoUpdated(info)),
    onActivityMetricsUpdate: (metrics) => dispatch(noiseActions.activityMetricsUpdated(metrics)),
    onPacketStatsUpdate: (stats) => dispatch(noiseActions.packetStatsUpdated(stats)),
  };
}

/**
 * BLE events arrive over time via callbacks (a scan can discover N devices,
 * a subscribed characteristic can notify indefinitely) rather than as a
 * single resolved promise value, so most of the state here is driven by
 * these plain reducers dispatched from NoiseBleService callbacks — the
 * thunks below just perform the one-shot imperative calls (start scanning,
 * connect, disconnect) and wire the callbacks to dispatch these actions.
 */
const noiseSlice = createSlice({
  name: 'noise',
  initialState,
  reducers: {
    scanStarted(state) {
      state.connectionState = 'scanning';
      state.errorMessage = null;
      state.discoveredDevices = [];
    },
    scanStopped(state) {
      if (state.connectionState === 'scanning') state.connectionState = state.discoveredDevices.length > 0 ? 'device_found' : 'idle';
    },
    deviceDiscovered(state, action: PayloadAction<NoiseDiscoveredDevice>) {
      // Upsert by id — the same physical device is re-discovered repeatedly
      // while scanning (that's how BLE advertising works), so this updates
      // the existing row in place (fresh RSSI, incremented sighting count,
      // original firstSeenAt preserved) instead of adding duplicate rows.
      const existingIndex = state.discoveredDevices.findIndex((d) => d.id === action.payload.id);
      if (existingIndex >= 0) {
        const existing = state.discoveredDevices[existingIndex];
        state.discoveredDevices[existingIndex] = { ...action.payload, firstSeenAt: existing.firstSeenAt, timesSeen: existing.timesSeen + 1 };
      } else {
        state.discoveredDevices.push(action.payload);
      }
      if (state.connectionState === 'scanning') state.connectionState = 'device_found';
    },
    connecting(state, action: PayloadAction<{ deviceId: string }>) {
      state.connectionState = 'connecting';
      state.errorMessage = null;
      state.connectedDeviceId = action.payload.deviceId;
    },
    connected(state, action: PayloadAction<{ deviceId: string; deviceName: string | null }>) {
      state.connectionState = 'connected';
      state.connectedDeviceId = action.payload.deviceId;
      state.connectedDeviceName = action.payload.deviceName;
      state.lastKnownDeviceId = action.payload.deviceId;
      state.lastKnownDeviceName = action.payload.deviceName;
      state.errorMessage = null;
    },
    reconnecting(state, action: PayloadAction<{ attempt: number }>) {
      state.connectionState = 'reconnecting';
      state.errorMessage = `Reconnecting (attempt ${action.payload.attempt})…`;
    },
    reconnectFailed(state) {
      state.connectionState = 'disconnected';
      state.connectedDeviceId = null;
      state.connectedDeviceName = null;
      state.errorMessage = 'Could not reconnect automatically. Tap Reconnect to try again.';
    },
    servicesDiscovered(state, action: PayloadAction<NoiseServiceInfo[]>) {
      state.services = action.payload;
    },
    rawPacketReceived(state, action: PayloadAction<RawPacketLogEntry>) {
      state.rawLog.unshift(action.payload);
      if (state.rawLog.length > MAX_RAW_LOG_ENTRIES) state.rawLog.length = MAX_RAW_LOG_ENTRIES;
    },
    deviceInfoUpdated(state, action: PayloadAction<NoiseDeviceInfo>) {
      state.deviceInfo = action.payload;
    },
    activityMetricsUpdated(state, action: PayloadAction<NoiseActivityMetrics>) {
      state.activityMetrics = action.payload;
    },
    packetStatsUpdated(state, action: PayloadAction<PacketStats[]>) {
      state.packetStats = action.payload;
    },
    disconnected(state) {
      state.connectionState = 'disconnected';
      state.connectedDeviceId = null;
      state.connectedDeviceName = null;
      state.services = [];
      state.deviceInfo = createEmptyDeviceInfo();
      state.activityMetrics = createEmptyActivityMetrics();
      state.packetStats = [];
      // A sync that was in flight when the connection dropped is now
      // meaningless — surface that plainly rather than leaving a stale
      // "Synchronizing…" label with nothing behind it.
      if (state.syncStatus === 'syncing') {
        state.syncStatus = 'error';
        state.syncError = 'connection_lost';
      }
    },
    bleError(state, action: PayloadAction<string>) {
      state.connectionState = action.payload === 'bluetooth_unavailable' ? 'bluetooth_unavailable' : action.payload === 'permission_denied' ? 'permission_denied' : 'error';
      state.errorMessage = action.payload;
    },
    syncStarted(state) {
      state.syncStatus = 'syncing';
      state.syncError = null;
    },
    syncSucceeded(state) {
      state.syncStatus = 'success';
      state.lastSyncedAt = new Date().toISOString();
      state.syncError = null;
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.syncStatus = 'error';
      state.syncError = action.payload;
    },
    autoSyncSet(state, action: PayloadAction<boolean>) {
      state.autoSyncEnabled = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const noiseActions = noiseSlice.actions;
export default noiseSlice.reducer;

export const startNoiseScanThunk = createAsyncThunk<void, void, { rejectValue: string }>('noise/startScan', async (_, { dispatch, rejectWithValue }) => {
  const state = await noiseBleService.getBluetoothState();
  if (state !== State.PoweredOn) {
    const reason = state === State.Unsupported ? 'bluetooth_unavailable' : `Bluetooth is ${state}`;
    dispatch(noiseActions.bleError(reason));
    return rejectWithValue(reason);
  }

  const granted = await noiseBleService.requestPermissions();
  if (!granted) {
    dispatch(noiseActions.bleError('permission_denied'));
    return rejectWithValue('permission_denied');
  }

  dispatch(noiseActions.scanStarted());
  noiseBleService.startScan({
    onDeviceDiscovered: (device) => dispatch(noiseActions.deviceDiscovered(device)),
    onScanError: (message) => dispatch(noiseActions.bleError(message)),
  });
});

export const stopNoiseScanThunk = createAsyncThunk('noise/stopScan', async (_, { dispatch }) => {
  noiseBleService.stopScan();
  dispatch(noiseActions.scanStopped());
});

type NoiseThunkApi = { state: { noise: ReturnType<typeof noiseSlice.reducer> } };

export const connectNoiseDeviceThunk = createAsyncThunk<void, string, NoiseThunkApi>('noise/connect', async (deviceId, { dispatch, getState }) => {
  // Guard against a second connect attempt firing while one is already in
  // flight or already connected (e.g. a fast double-tap on a device row).
  const { connectionState, connectedDeviceId } = getState().noise;
  if (connectionState === 'connecting' || connectionState === 'reconnecting' || (connectionState === 'connected' && connectedDeviceId === deviceId)) return;

  dispatch(noiseActions.connecting({ deviceId }));
  await noiseBleService.connect(deviceId, {
    onConnected: (id, name) => dispatch(noiseActions.connected({ deviceId: id, deviceName: name })),
    onConnectError: (message) => dispatch(noiseActions.bleError(message)),
    onDisconnected: (id, reason) => {
      noiseLog.disconnected(id, reason);
      dispatch(noiseActions.disconnected());
    },
    onReconnecting: (attempt) => dispatch(noiseActions.reconnecting({ attempt })),
    onReconnectFailed: () => dispatch(noiseActions.reconnectFailed()),
    onServicesDiscovered: (services) => dispatch(noiseActions.servicesDiscovered(services)),
    ...buildDataCallbacks(dispatch),
  });

  // Read-only characteristics (battery etc.) don't notify on their own —
  // auto-sync keeps them from going stale without a tight poll. Notify
  // characteristics are untouched here; connect() already subscribed them.
  if (getState().noise.connectionState === 'connected' && getState().noise.autoSyncEnabled) {
    noiseBleService.setAutoSync(true, buildDataCallbacks(dispatch));
  }
});

export const disconnectNoiseDeviceThunk = createAsyncThunk('noise/disconnect', async (_, { dispatch }) => {
  noiseBleService.setAutoSync(false, {});
  await noiseBleService.disconnect();
  dispatch(noiseActions.disconnected());
});

export const syncNowThunk = createAsyncThunk<void, void, NoiseThunkApi>('noise/syncNow', async (_, { dispatch, getState }) => {
  const { connectionState, syncStatus } = getState().noise;
  if (connectionState !== 'connected') {
    dispatch(noiseActions.syncFailed('not_connected'));
    return;
  }
  if (syncStatus === 'syncing') return; // already in flight — don't double-fire (Sync Now button is also disabled while syncing, this is the belt-and-braces guard)

  dispatch(noiseActions.syncStarted());
  const result = await noiseBleService.syncNow(buildDataCallbacks(dispatch));
  if (result.success) dispatch(noiseActions.syncSucceeded());
  else dispatch(noiseActions.syncFailed(result.error ?? 'sync_failed'));
});

export const setAutoSyncThunk = createAsyncThunk<void, boolean>('noise/setAutoSync', async (enabled, { dispatch }) => {
  dispatch(noiseActions.autoSyncSet(enabled));
  noiseBleService.setAutoSync(enabled, buildDataCallbacks(dispatch));
});
