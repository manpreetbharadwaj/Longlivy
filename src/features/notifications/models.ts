export type NotificationEventType =
  | 'fasting_begins'
  | 'fasting_ends'
  | 'eating_phase_begins'
  | 'interim_goal_achieved'
  | 'fasting_almost_over'
  | 'planned_fast_not_started'
  | 'fasting_streak_reached'
  | 'personal_best_achieved'
  | 'activity_reminder'
  | 'activity_goal_achieved'
  | 'calorie_goal_almost_reached'
  | 'calorie_target_exceeded'
  | 'protein_goal_achieved'
  | 'weight_reminder'
  | 'meditation_reminder';

export interface NotificationSetting {
  type: NotificationEventType;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}
