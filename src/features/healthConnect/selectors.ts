import { RootState } from '@/store/store';

export const selectHealthConnectStatus = (state: RootState) => state.healthConnect.status;
export const selectHealthConnectHasAllPermissions = (state: RootState) => state.healthConnect.hasAllPermissions;
export const selectHealthConnectGrantedRecordTypes = (state: RootState) => state.healthConnect.grantedRecordTypes;
export const selectHealthConnectMetrics = (state: RootState) => state.healthConnect.metrics;
export const selectHealthConnectDebugInfo = (state: RootState) => state.healthConnect.debugInfo;
export const selectHealthConnectRefreshStatus = (state: RootState) => state.healthConnect.refreshStatus;
export const selectHealthConnectLastCheckedAt = (state: RootState) => state.healthConnect.lastCheckedAt;
export const selectHealthConnectLastDataReceivedAt = (state: RootState) => state.healthConnect.lastDataReceivedAt;
export const selectHealthConnectNewDataFieldKeys = (state: RootState) => state.healthConnect.newDataFieldKeys;
export const selectHealthConnectErrorMessage = (state: RootState) => state.healthConnect.errorMessage;
export const selectIsHealthConnectReady = (state: RootState) => state.healthConnect.status === 'ready';
