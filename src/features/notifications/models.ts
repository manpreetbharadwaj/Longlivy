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

/**
 * The slice's `DEFAULT_SETTINGS` bakes English `label`/`description` text
 * directly into Redux state (pre-existing, not changed here) — these
 * resolvers give the display layer a translated alternative keyed off the
 * stable `type`, with the stored string as a safe fallback for any future
 * server-defined type not yet in the translation table.
 */
export function notificationTypeLabel(setting: Pick<NotificationSetting, 'type' | 'label'>, t: (key: import('@/localization').TranslationKey) => string): string {
  switch (setting.type) {
    case 'fasting_begins':
      return t('notifications.types.fasting_begins.label');
    case 'fasting_ends':
      return t('notifications.types.fasting_ends.label');
    case 'eating_phase_begins':
      return t('notifications.types.eating_phase_begins.label');
    case 'interim_goal_achieved':
      return t('notifications.types.interim_goal_achieved.label');
    case 'fasting_almost_over':
      return t('notifications.types.fasting_almost_over.label');
    case 'planned_fast_not_started':
      return t('notifications.types.planned_fast_not_started.label');
    case 'fasting_streak_reached':
      return t('notifications.types.fasting_streak_reached.label');
    case 'personal_best_achieved':
      return t('notifications.types.personal_best_achieved.label');
    case 'activity_reminder':
      return t('notifications.types.activity_reminder.label');
    case 'activity_goal_achieved':
      return t('notifications.types.activity_goal_achieved.label');
    case 'calorie_goal_almost_reached':
      return t('notifications.types.calorie_goal_almost_reached.label');
    case 'calorie_target_exceeded':
      return t('notifications.types.calorie_target_exceeded.label');
    case 'protein_goal_achieved':
      return t('notifications.types.protein_goal_achieved.label');
    case 'weight_reminder':
      return t('notifications.types.weight_reminder.label');
    case 'meditation_reminder':
      return t('notifications.types.meditation_reminder.label');
    default:
      return setting.label;
  }
}

export function notificationTypeDescription(setting: Pick<NotificationSetting, 'type' | 'description'>, t: (key: import('@/localization').TranslationKey) => string): string {
  switch (setting.type) {
    case 'fasting_begins':
      return t('notifications.types.fasting_begins.description');
    case 'fasting_ends':
      return t('notifications.types.fasting_ends.description');
    case 'eating_phase_begins':
      return t('notifications.types.eating_phase_begins.description');
    case 'interim_goal_achieved':
      return t('notifications.types.interim_goal_achieved.description');
    case 'fasting_almost_over':
      return t('notifications.types.fasting_almost_over.description');
    case 'planned_fast_not_started':
      return t('notifications.types.planned_fast_not_started.description');
    case 'fasting_streak_reached':
      return t('notifications.types.fasting_streak_reached.description');
    case 'personal_best_achieved':
      return t('notifications.types.personal_best_achieved.description');
    case 'activity_reminder':
      return t('notifications.types.activity_reminder.description');
    case 'activity_goal_achieved':
      return t('notifications.types.activity_goal_achieved.description');
    case 'calorie_goal_almost_reached':
      return t('notifications.types.calorie_goal_almost_reached.description');
    case 'calorie_target_exceeded':
      return t('notifications.types.calorie_target_exceeded.description');
    case 'protein_goal_achieved':
      return t('notifications.types.protein_goal_achieved.description');
    case 'weight_reminder':
      return t('notifications.types.weight_reminder.description');
    case 'meditation_reminder':
      return t('notifications.types.meditation_reminder.description');
    default:
      return setting.description;
  }
}

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}
