import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncQueueItem } from './models';

interface SyncState {
  isOnline: boolean;
  queue: SyncQueueItem[];
}

const initialState: SyncState = { isOnline: true, queue: [] };

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    enqueueSyncItem(state, action: PayloadAction<SyncQueueItem>) {
      state.queue.push(action.payload);
    },
    markSynced(state, action: PayloadAction<string>) {
      const item = state.queue.find((q) => q.id === action.payload);
      if (item) item.status = 'synced';
      state.queue = state.queue.filter((q) => q.status !== 'synced');
    },
  },
});

export const { setOnlineStatus, enqueueSyncItem, markSynced } = syncSlice.actions;
export default syncSlice.reducer;
