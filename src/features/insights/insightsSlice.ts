import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { env } from '@/config/env';
import { EnergyBalance, FastingSummary, insightsApi, MeditationStats } from '@/services/api/insightsApi';
import { localDateKey } from '@/services/api/laravel';
import { logoutThunk, markSessionExpired } from '@/features/auth/authSlice';

/**
 * Server-side aggregates (streaks, fasting summary, meditation stats, energy
 * balance). API mode only: in mock mode everything stays null and the
 * selectors fall back to their on-device calculations. Each value loads
 * independently, so one failing endpoint never blanks the others.
 */
interface InsightsState {
  fastingStreak: number | null;
  meditationStreak: number | null;
  fastingSummary: FastingSummary | null;
  meditationStats: MeditationStats | null;
  energyBalance: EnergyBalance | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: InsightsState = {
  fastingStreak: null,
  meditationStreak: null,
  fastingSummary: null,
  meditationStats: null,
  energyBalance: null,
  status: 'idle',
};

export const insightsEnabled = !env.useMockApi;

type Loaded = Partial<Omit<InsightsState, 'status'>>;

export const loadInsightsThunk = createAsyncThunk<Loaded>('insights/load', async () => {
  const [streaks, fastingSummary, meditationStats, meditationStreak, energyBalance] = await Promise.allSettled([
    insightsApi.streaks(),
    insightsApi.fastingSummary(),
    insightsApi.meditationStats(),
    insightsApi.meditationStreak(),
    insightsApi.energyBalance(localDateKey()),
  ]);
  const out: Loaded = {};
  if (streaks.status === 'fulfilled') {
    out.fastingStreak = streaks.value.fasting;
    out.meditationStreak = streaks.value.meditation;
  }
  if (fastingSummary.status === 'fulfilled') {
    out.fastingSummary = fastingSummary.value;
    out.fastingStreak = fastingSummary.value.currentStreak;
  }
  if (meditationStats.status === 'fulfilled') out.meditationStats = meditationStats.value;
  if (meditationStreak.status === 'fulfilled') out.meditationStreak = meditationStreak.value;
  if (energyBalance.status === 'fulfilled') out.energyBalance = energyBalance.value;
  if (Object.keys(out).length === 0) throw new Error('Insights could not be loaded.');
  return out;
}, { condition: () => insightsEnabled });

const insightsSlice = createSlice({
  name: 'insights',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadInsightsThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadInsightsThunk.fulfilled, (state, action) => ({ ...state, ...action.payload, status: 'succeeded' }))
      .addCase(loadInsightsThunk.rejected, (state) => {
        state.status = 'failed';
      })
      // Never show one account's aggregates to the next one on this device.
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(markSessionExpired, () => initialState);
  },
});

export default insightsSlice.reducer;
