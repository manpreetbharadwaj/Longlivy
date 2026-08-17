import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { HealthPlatformConnection, HealthPlatformId } from './models';
import { HEALTH_ADAPTERS } from './adapters/MockHealthAdapter';

interface HealthIntegrationState {
  connections: HealthPlatformConnection[];
}

const initialState: HealthIntegrationState = {
  connections: Object.values(HEALTH_ADAPTERS).map((adapter) => ({
    platform: adapter.platform,
    displayName: adapter.displayName,
    connected: false,
    lastSyncedAt: null,
    grantedScopes: [],
  })),
};

export const connectHealthPlatformThunk = createAsyncThunk('health/connect', async (platform: HealthPlatformId) => {
  const adapter = HEALTH_ADAPTERS[platform];
  await adapter.requestPermissions();
  return platform;
});

export const disconnectHealthPlatformThunk = createAsyncThunk('health/disconnect', async (platform: HealthPlatformId) => {
  const adapter = HEALTH_ADAPTERS[platform];
  await adapter.disconnect();
  return platform;
});

const healthIntegrationSlice = createSlice({
  name: 'healthIntegration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(connectHealthPlatformThunk.fulfilled, (state, action) => {
        const conn = state.connections.find((c) => c.platform === action.payload);
        if (conn) {
          conn.connected = true;
          conn.lastSyncedAt = new Date().toISOString();
          conn.grantedScopes = ['activity', 'steps', 'sleep', 'weight', 'heart_rate'];
        }
      })
      .addCase(disconnectHealthPlatformThunk.fulfilled, (state, action) => {
        const conn = state.connections.find((c) => c.platform === action.payload);
        if (conn) {
          conn.connected = false;
          conn.lastSyncedAt = null;
          conn.grantedScopes = [];
        }
      });
  },
});

export default healthIntegrationSlice.reducer;
