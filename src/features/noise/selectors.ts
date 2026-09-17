import { RootState } from '@/store/store';

export const selectNoiseConnectionState = (state: RootState) => state.noise.connectionState;
export const selectNoiseErrorMessage = (state: RootState) => state.noise.errorMessage;
export const selectDiscoveredNoiseDevices = (state: RootState) => state.noise.discoveredDevices;
export const selectConnectedNoiseDeviceName = (state: RootState) => state.noise.connectedDeviceName;
export const selectConnectedNoiseDeviceId = (state: RootState) => state.noise.connectedDeviceId;
export const selectLastKnownNoiseDeviceId = (state: RootState) => state.noise.lastKnownDeviceId;
export const selectLastKnownNoiseDeviceName = (state: RootState) => state.noise.lastKnownDeviceName;
export const selectNoiseServices = (state: RootState) => state.noise.services;
export const selectNoiseDeviceInfo = (state: RootState) => state.noise.deviceInfo;
export const selectNoiseActivityMetrics = (state: RootState) => state.noise.activityMetrics;
export const selectNoisePacketStats = (state: RootState) => state.noise.packetStats;
export const selectNoiseRawLog = (state: RootState) => state.noise.rawLog;
export const selectIsNoiseConnected = (state: RootState) => state.noise.connectionState === 'connected';
export const selectNoiseSyncStatus = (state: RootState) => state.noise.syncStatus;
export const selectNoiseLastSyncedAt = (state: RootState) => state.noise.lastSyncedAt;
export const selectNoiseSyncError = (state: RootState) => state.noise.syncError;
export const selectNoiseAutoSyncEnabled = (state: RootState) => state.noise.autoSyncEnabled;
