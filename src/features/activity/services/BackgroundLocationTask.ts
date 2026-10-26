import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { locationToGpsPoint } from '../hooks/useGpsTracking';
import { caloriesFromMetHours } from './ActivityCalculator';
import {
  readLiveSession,
  writeLiveSession,
  trackerFromSession,
  activeDurationMs,
  LiveWorkoutSession,
} from './BackgroundWorkoutSession';
import { updateWorkoutNotification } from './ActiveWorkoutNotification';
import { announceMilestonesIfDue } from './VoiceCoach';

export const BACKGROUND_LOCATION_TASK = 'longlivy-background-workout-location';

/**
 * Runs regardless of whether `ActiveActivityScreen` is mounted — Android
 * dispatches this task to a background JS context driven by the foreground
 * service started in `useBackgroundGpsTracking`, so distance, calories and
 * voice milestones all keep advancing with the screen locked or another app
 * in front. The persisted `LiveWorkoutSession` (see BackgroundWorkoutSession)
 * is the single source of truth both this task and the UI read from.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const session = await readLiveSession();
  if (!session || session.status !== 'active') return;

  const tracker = trackerFromSession(session);
  if (session.pendingSegmentBreak) tracker.breakSegment();
  let next: LiveWorkoutSession = { ...session, pendingSegmentBreak: false };

  for (const location of locations) {
    const point = locationToGpsPoint(location);
    if (!point) continue;
    const result = tracker.addPoint(point);
    const snapshot = tracker.snapshot();
    next = {
      ...next,
      route: snapshot.route,
      distanceMeters: snapshot.distanceMeters,
      movingDurationMs: snapshot.movingDuration,
      metHours: snapshot.metHours,
      elevationGainMeters: snapshot.elevationGainMeters,
      currentSpeedKmh: snapshot.currentSpeedKmh,
      gpsUnavailableReason: result.accepted || result.reason === 'segment_break' ? null : next.gpsUnavailableReason,
    };
  }

  await writeLiveSession(next);

  const calories = caloriesFromMetHours(next.metHours, next.weightKg);
  const activeMs = activeDurationMs(next);

  await updateWorkoutNotification(next, activeMs, calories);
  await announceMilestonesIfDue(next, activeMs, calories);
});

export function isBackgroundLocationTaskDefined(): boolean {
  return TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK);
}
