import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

const ANDROID_CHANNEL_ID = 'meditation-reminders';
let handlerConfigured = false;
let androidChannelConfigured = false;

/**
 * Foreground presentation — a meditation reminder is calm, low-stakes
 * content, so it's fine to show it (banner + sound) even while the app is
 * already open, same as most alarm/reminder apps. Configured once per
 * process, mirroring the singleton-init pattern already used by
 * useMeditationAudioSession's `audioModeConfigured`.
 */
function ensureHandlerConfigured(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (androidChannelConfigured || Platform.OS !== 'android') return;
  androidChannelConfigured = true;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Meditation reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Internal-storage weekday (0=Sunday..6=Saturday, matching JS `Date.getDay()`)
 * → the 1-7/Sunday=1 convention `expo-notifications`' `WeeklyTriggerInput`
 * requires. The ONLY place this conversion happens (Section 4/26) — nothing
 * else in the app should reimplement it.
 */
function toExpoWeekday(jsWeekday: number): number {
  return jsWeekday + 1;
}

export type MeditationNotificationPermission = 'granted' | 'denied' | 'undetermined';

function toSimplePermission(status: Notifications.PermissionStatus): MeditationNotificationPermission {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

/**
 * Thin, isolated wrapper around `expo-notifications` — the rest of the
 * Meditation feature never imports it directly, same isolation pattern
 * `VoiceAnnouncer`/`GpsTrackingService` already use for their own native
 * APIs. Never calls the permission prompt on its own initiative — only when
 * the screen explicitly asks, itself only in response to a real user action
 * (Section 9).
 */
export async function getNotificationPermission(): Promise<MeditationNotificationPermission> {
  const result = await Notifications.getPermissionsAsync();
  return toSimplePermission(result.status);
}

export async function requestNotificationPermission(): Promise<MeditationNotificationPermission> {
  ensureHandlerConfigured();
  const result = await Notifications.requestPermissionsAsync();
  return toSimplePermission(result.status);
}

/** Schedules one recurring weekly notification per day in `daysOfWeek` and returns their ids in the same order — callers persist this as `MeditationReminder.notificationIds`. */
export async function scheduleMeditationReminder(daysOfWeek: number[], time: string, content: { title: string; body: string }): Promise<string[]> {
  ensureHandlerConfigured();
  await ensureAndroidChannel();
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const ids = await Promise.all(
    daysOfWeek.map((jsWeekday) =>
      Notifications.scheduleNotificationAsync({
        content: { title: content.title, body: content.body },
        trigger: {
          type: SchedulableTriggerInputTypes.WEEKLY,
          weekday: toExpoWeekday(jsWeekday),
          hour,
          minute,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      })
    )
  );
  return ids;
}

/** Cancels every given notification id — safe to call with ids that no longer exist (e.g. already fired a non-repeating trigger, or already cancelled); expo-notifications resolves rather than throwing for an unknown id. */
export async function cancelMeditationReminderNotifications(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {
        // Already gone (fired, cancelled, or never existed after an OS cleanup) — nothing further to do (Section 20/34).
      })
    )
  );
}

/**
 * Returns the ids of every currently *live* OS schedule — used to detect
 * drift between LocalStore and reality (Section 20): an app reinstall, an OS
 * cleanup, or a permission revocation can all silently invalidate a stored
 * `notificationIds` list without the app ever being told. Never throws — an
 * empty result just means "treat every stored id as unverifiable."
 */
export async function getLiveScheduledNotificationIds(): Promise<Set<string>> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return new Set(scheduled.map((request) => request.identifier));
  } catch {
    return new Set();
  }
}
