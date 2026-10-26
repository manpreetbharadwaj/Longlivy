import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { WORKOUT_ACTION, dismissWorkoutNotification, updateWorkoutNotification } from './ActiveWorkoutNotification';
import { readLiveSession, writeLiveSession, activeDurationMs } from './BackgroundWorkoutSession';
import { BACKGROUND_LOCATION_TASK } from './BackgroundLocationTask';
import { caloriesFromMetHours } from './ActivityCalculator';

/**
 * Handles the Pause/Resume/Stop buttons on the active-workout notification
 * at the session level — written to `LiveWorkoutSession` directly rather
 * than dispatched through Redux, because this can run from a notification
 * tap while `ActiveActivityScreen` (and the store subscription the UI reads
 * from) isn't mounted. The screen reconciles itself against this session on
 * its next mount/poll (see useBackgroundGpsTracking), and `Activity`-record
 * finalization for a "Stop" happens there once the UI is next open — Health
 * Connect-style "safely finalize on the next supported lifecycle point"
 * rather than reaching into Redux from a background task.
 */
async function handleAction(actionIdentifier: string): Promise<void> {
  const session = await readLiveSession();
  if (!session) return;

  if (actionIdentifier === WORKOUT_ACTION.pause && session.status === 'active') {
    const next = { ...session, status: 'paused' as const, pauseStartedAt: new Date().toISOString() };
    await writeLiveSession(next);
    try {
      const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch {
      // Already stopped.
    }
    await updateWorkoutNotification(next, activeDurationMs(next), caloriesFromMetHours(next.metHours, next.weightKg));
    return;
  }

  if (actionIdentifier === WORKOUT_ACTION.resume && session.status === 'paused') {
    const pausedMs = session.pauseStartedAt ? Date.now() - new Date(session.pauseStartedAt).getTime() : 0;
    const next = { ...session, status: 'active' as const, pauseStartedAt: null, pauseDurationMs: session.pauseDurationMs + pausedMs, pendingSegmentBreak: true };
    await writeLiveSession(next);
    await updateWorkoutNotification(next, activeDurationMs(next), caloriesFromMetHours(next.metHours, next.weightKg));
    try {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 2,
        foregroundService: { notificationTitle: 'LongLivy is tracking your activity', notificationBody: 'Tracking resumed — tap to open LongLivy.' },
      });
    } catch {
      // The UI retries this on next open if it fails here.
    }
    return;
  }

  if (actionIdentifier === WORKOUT_ACTION.stop) {
    // Mark the session stopped-but-unfinalized; the UI finalizes the real
    // Activity record (calories, backend upload) once it's next open, which
    // is the only place `profile.weightKg` and the Redux-backed repository
    // are reliably available. Clearing the notification and OS tracking
    // happens immediately either way, so nothing keeps running unexpectedly.
    try {
      const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch {
      // Already stopped.
    }
    await writeLiveSession({ ...session, status: 'paused', pauseStartedAt: session.pauseStartedAt ?? new Date().toISOString() });
    await dismissWorkoutNotification();
  }
}

export function registerWorkoutNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.content.data?.kind !== 'active-workout') return;
    void handleAction(response.actionIdentifier);
  });
  return () => subscription.remove();
}

export const BACKGROUND_NOTIFICATION_TASK = 'longlivy-background-notification-response';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data }) => {
  const payload = data as { actionIdentifier?: string } | undefined;
  if (payload && 'actionIdentifier' in payload && payload.actionIdentifier) {
    await handleAction(payload.actionIdentifier);
  }
});

export async function ensureBackgroundNotificationTaskRegistered(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch {
    // Some Android versions/OEMs don't support headless notification-response delivery — the foreground listener above still covers the app-alive case.
  }
}

