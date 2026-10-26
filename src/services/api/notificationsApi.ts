import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataRecord } from './laravel';
import { NotificationEventType } from '@/features/notifications/models';

export type NotificationSettingsMap = Partial<Record<NotificationEventType, boolean>>;

/** `data.settings` holds one boolean per event type (verified 2026-10-19: the 15 app types, nothing else). */
function mapSettings(body: unknown): NotificationSettingsMap {
  const raw = dataRecord(body, 'settings');
  const settings: NotificationSettingsMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'boolean') settings[key as NotificationEventType] = value;
  }
  return settings;
}

function getSettings(): Promise<NotificationSettingsMap> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.notifications.settings }, mapSettings);
}

/** Partial updates are accepted; an unknown type is rejected with 422. */
function updateSettings(changes: NotificationSettingsMap): Promise<NotificationSettingsMap> {
  return apiRequestParsed({ method: 'PUT', url: API_ENDPOINTS.notifications.settings, data: { settings: changes } }, mapSettings);
}

export const notificationsApi = { getSettings, updateSettings };
