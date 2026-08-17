import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HistoryCategory } from './models';

interface HistoryState {
  activeFilters: HistoryCategory[];
}

const ALL_CATEGORIES: HistoryCategory[] = ['fasting', 'nutrition', 'activity', 'weight', 'meditation'];

const initialState: HistoryState = { activeFilters: ALL_CATEGORIES };

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    toggleHistoryFilter(state, action: PayloadAction<HistoryCategory>) {
      state.activeFilters = state.activeFilters.includes(action.payload)
        ? state.activeFilters.filter((c) => c !== action.payload)
        : [...state.activeFilters, action.payload];
    },
    resetHistoryFilters(state) {
      state.activeFilters = ALL_CATEGORIES;
    },
  },
});

export const { toggleHistoryFilter, resetHistoryFilters } = historySlice.actions;
export default historySlice.reducer;
