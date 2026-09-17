import { RootState } from '@/store/store';

export const selectHealthKitStatus = (state: RootState) => state.healthKit.status;
export const selectHealthKitHasRequestedPermissions = (state: RootState) => state.healthKit.hasRequestedPermissions;
export const selectHealthKitAuthorizationStatuses = (state: RootState) => state.healthKit.authorizationStatuses;
export const selectHealthKitMetrics = (state: RootState) => state.healthKit.metrics;
export const selectHealthKitDebugInfo = (state: RootState) => state.healthKit.debugInfo;
export const selectHealthKitRefreshStatus = (state: RootState) => state.healthKit.refreshStatus;
export const selectHealthKitLastCheckedAt = (state: RootState) => state.healthKit.lastCheckedAt;
export const selectHealthKitLastDataReceivedAt = (state: RootState) => state.healthKit.lastDataReceivedAt;
export const selectHealthKitNewDataFieldKeys = (state: RootState) => state.healthKit.newDataFieldKeys;
export const selectHealthKitErrorMessage = (state: RootState) => state.healthKit.errorMessage;
export const selectIsHealthKitReady = (state: RootState) => state.healthKit.status === 'ready';
