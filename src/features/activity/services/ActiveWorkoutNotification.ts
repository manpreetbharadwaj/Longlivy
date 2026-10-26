import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ActivityType, ACTIVITY_TYPE_LABELS } from '../models';
import { LiveWorkoutSession } from './BackgroundWorkoutSession';
import { formatActivityDuration } from './ActivityCalculator';

/**
 * The one visible, interactive notification for an in-progress workout —
 * kept separate from the bare notification `expo-location`'s own foreground
 * service raises (that one only exists so Android keeps the service alive;
 * it has no actions). This one carries the live stats and the Pause/Resume/
 * Stop buttons, and is re-scheduled under the same fixed identifier on every
 * update so Android replaces it in place instead of stacking duplicates.
 */
const CHANNEL_ID = 'active-workout';
const CATEGORY_ID = 'active-workout-controls';
export const NOTIFICATION_ID = 'longlivy-active-workout';

export const WORKOUT_ACTION = {
  pause: 'workout-pause',
  resume: 'workout-resume',
  stop: 'workout-stop',
} as const;

let setUpDone = false;

export async function ensureWorkoutNotificationSetUp(): Promise<void> {
  if (setUpDone) return;
  setUpDone = true;
  // Required or `scheduleNotificationAsync` creates the notification without
  // ever actually presenting it — see that function's own doc note. Global
  // (last call wins, same as MeditationNotificationService's), so this must
  // win regardless of which feature's `ensureHandlerConfigured`-style setup
  // happens to run first: no banner/sound for an ongoing stats update, but
  // it must stay visible in the shade.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  // Best-effort: a denied notification permission must never block tracking
  // itself (the foreground service still runs and GPS still records either
  // way) — it only means this particular notification stays invisible,
  // which `requestForWorkoutNotificationPermission`'s caller can surface.
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted' && current.canAskAgain) await Notifications.requestPermissionsAsync();
  } catch {
    // Platform doesn't support the check, or it failed — proceed anyway.
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Active workout',
      importance: Notifications.AndroidImportance.LOW,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: null,
      vibrationPattern: null,
    });
  }
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: WORKOUT_ACTION.pause, buttonTitle: 'Pause' },
    { identifier: WORKOUT_ACTION.resume, buttonTitle: 'Resume' },
    { identifier: WORKOUT_ACTION.stop, buttonTitle: 'Stop', options: { isDestructive: true } },
  ]);
}

function statsLine(distanceMeters: number | null, activeMs: number, calories: number | null): string {
  const km = distanceMeters != null ? (distanceMeters / 1000).toFixed(2) : '0.00';
  const time = formatActivityDuration(activeMs);
  const kcal = calories != null ? Math.round(calories) : 0;
  return `Distance: ${km} km   Duration: ${time}   Calories: ${kcal} kcal`;
}

export async function updateWorkoutNotification(
  session: LiveWorkoutSession,
  activeMs: number,
  calories: number | null
): Promise<void> {
  await ensureWorkoutNotificationSetUp();
  const label = ACTIVITY_TYPE_LABELS[session.type as ActivityType] ?? 'Activity';
  const paused = session.status === 'paused';
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: `LongLivy — ${label} ${paused ? 'Paused' : 'in Progress'}`,
      body: statsLine(session.distanceMeters, activeMs, calories),
      sticky: true,
      autoDismiss: false,
      categoryIdentifier: CATEGORY_ID,
      data: { activityId: session.activityId, kind: 'active-workout' },
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

export async function dismissWorkoutNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  } catch {
    // Best-effort — already dismissed is not an error worth surfacing.
  }
}
