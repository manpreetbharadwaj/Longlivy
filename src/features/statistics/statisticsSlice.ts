import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type StatisticsPeriod = 'day' | 'week' | 'month' | 'year' | 'total';

interface StatisticsState {
  period: StatisticsPeriod;
}

const initialState: StatisticsState = { period: 'week' };

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    setStatisticsPeriod(state, action: PayloadAction<StatisticsPeriod>) {
      state.period = action.payload;
    },
  },
});

export const { setStatisticsPeriod } = statisticsSlice.actions;
export default statisticsSlice.reducer;
