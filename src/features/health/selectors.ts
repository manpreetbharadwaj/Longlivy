import { RootState } from '@/store/store';

export const selectHealthConnections = (state: RootState) => state.healthIntegration.connections;
