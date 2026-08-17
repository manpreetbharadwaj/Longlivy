import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification, NotificationEventType, NotificationSetting } from './models';

interface NotificationState {
  settings: NotificationSetting[];
  items: AppNotification[];
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  { type: 'fasting_begins', label: 'Fasting begins', description: 'When a planned fast starts.', enabled: true },
  { type: 'fasting_ends', label: 'Fasting ends', description: 'When your fast reaches its planned end.', enabled: true },
  { type: 'eating_phase_begins', label: 'Eating window begins', description: 'When your eating window opens.', enabled: true },
  { type: 'interim_goal_achieved', label: 'Interim goal achieved', description: 'When you hit a milestone during a fast.', enabled: false },
  { type: 'fasting_almost_over', label: 'Fasting almost over', description: 'A heads-up shortly before your fast ends.', enabled: true },
  { type: 'planned_fast_not_started', label: 'Planned fast not started', description: 'When a scheduled fast was not started.', enabled: false },
  { type: 'fasting_streak_reached', label: 'Fasting streak reached', description: 'When you reach a new fasting streak.', enabled: true },
  { type: 'personal_best_achieved', label: 'Personal best achieved', description: 'When you set a new personal record.', enabled: true },
  { type: 'activity_reminder', label: 'Activity reminder', description: 'A nudge to stay active.', enabled: false },
  { type: 'activity_goal_achieved', label: 'Activity goal achieved', description: 'When your daily activity goal is met.', enabled: true },
  { type: 'calorie_goal_almost_reached', label: 'Calorie goal almost reached', description: 'When you approach your calorie goal.', enabled: true },
  { type: 'calorie_target_exceeded', label: 'Calorie target exceeded', description: 'When you exceed your calorie goal.', enabled: true },
  { type: 'protein_goal_achieved', label: 'Protein goal achieved', description: 'When your protein goal is met.', enabled: false },
  { type: 'weight_reminder', label: 'Weight entry reminder', description: 'A reminder to log today’s weight.', enabled: true },
  { type: 'meditation_reminder', label: 'Meditation reminder', description: 'Your scheduled meditation reminders.', enabled: true },
];

const initialState: NotificationState = {
  settings: DEFAULT_SETTINGS,
  items: [
    { id: 'n1', type: 'fasting_streak_reached', title: 'New streak!', body: 'You’ve completed 5 fasts in a row.', timestamp: new Date().toISOString(), read: false },
    { id: 'n2', type: 'protein_goal_achieved', title: 'Protein goal reached', body: 'You hit your protein target today.', timestamp: new Date(Date.now() - 3600_000).toISOString(), read: false },
    { id: 'n3', type: 'meditation_reminder', title: 'Time for your meditation', body: 'A calm moment is waiting for you.', timestamp: new Date(Date.now() - 7200_000).toISOString(), read: true },
  ],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    toggleNotificationSetting(state, action: PayloadAction<NotificationEventType>) {
      const setting = state.settings.find((s) => s.type === action.payload);
      if (setting) setting.enabled = !setting.enabled;
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.read = true;
    },
    markAllNotificationsRead(state) {
      state.items.forEach((i) => (i.read = true));
    },
  },
});

export const { toggleNotificationSetting, markNotificationRead, markAllNotificationsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
