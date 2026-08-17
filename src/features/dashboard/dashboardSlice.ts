import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardState {
  lastRefreshedAt: string | null;
}

const initialState: DashboardState = { lastRefreshedAt: null };

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardRefreshed(state, action: PayloadAction<string>) {
      state.lastRefreshedAt = action.payload;
    },
  },
});

export const { setDashboardRefreshed } = dashboardSlice.actions;
export default dashboardSlice.reducer;
