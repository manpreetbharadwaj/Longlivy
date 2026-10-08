import { createListenerMiddleware } from '@reduxjs/toolkit';
import { insightsEnabled, loadInsightsThunk } from './insightsSlice';

/**
 * Refreshes the server aggregates after anything that changes them (and after
 * the data loads screens already do on focus). Debounced so a screen that
 * fires several loads at once costs one round of insight requests.
 */
const TRIGGERS = new Set([
  'auth/bootstrap',
  'auth/login',
  'auth/register',
  'fasting/loadFastingData',
  'fasting/startFast',
  'fasting/endFast',
  'fasting/extendFast',
  'fasting/cancelFast',
  'fasting/saveSchedule',
  'meditation/loadData',
  'meditation/completeSession',
  'nutrition/loadTodayMeals',
  'nutrition/addFoodToMeal',
  'nutrition/loadTargets',
  'nutrition/saveTarget',
  'weight/logWeight',
  'profile/saveChanges',
]);

export const insightsListener = createListenerMiddleware();

insightsListener.startListening({
  predicate: (action) => insightsEnabled && action.type.endsWith('/fulfilled') && TRIGGERS.has(action.type.slice(0, -'/fulfilled'.length)),
  effect: async (_action, api) => {
    api.cancelActiveListeners();
    await api.delay(400);
    const state = api.getState() as { auth: { session: unknown } };
    if (state.auth.session) await api.dispatch(loadInsightsThunk());
  },
});
