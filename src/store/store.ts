import { configureStore } from '@reduxjs/toolkit';

import authReducer from '@/features/auth/authSlice';
import profileReducer from '@/features/profile/profileSlice';
import fastingReducer from '@/features/fasting/fastingSlice';
import nutritionReducer from '@/features/nutrition/nutritionSlice';
import activityReducer from '@/features/activity/activitySlice';
import calorieReducer from '@/features/calories/calorieSlice';
import weightReducer from '@/features/weight/weightSlice';
import meditationReducer from '@/features/meditation/meditationSlice';
import goalsReducer from '@/features/goals/goalsSlice';
import statisticsReducer from '@/features/statistics/statisticsSlice';
import notificationReducer from '@/features/notifications/notificationSlice';
import healthIntegrationReducer from '@/features/health/healthIntegrationSlice';
import historyReducer from '@/features/history/historySlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';
import syncReducer from '@/features/sync/syncSlice';
import healthConnectReducer from '@/features/healthConnect/healthConnectSlice';
import healthKitReducer from '@/features/healthKit/healthKitSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    fasting: fastingReducer,
    nutrition: nutritionReducer,
    activity: activityReducer,
    calorie: calorieReducer,
    weight: weightReducer,
    meditation: meditationReducer,
    goals: goalsReducer,
    statistics: statisticsReducer,
    notification: notificationReducer,
    healthIntegration: healthIntegrationReducer,
    history: historyReducer,
    dashboard: dashboardReducer,
    sync: syncReducer,
    healthConnect: healthConnectReducer,
    healthKit: healthKitReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Sessions/timestamps are plain ISO strings by convention, so the
      // default serializability checks are safe to keep enabled.
      serializableCheck: true,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
