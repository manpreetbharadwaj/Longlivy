import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { ActivityType } from '../models';
import { GpsTrackingState, GpsTrackingStatus } from './useGpsTracking';
import { BACKGROUND_LOCATION_TASK } from '../services/BackgroundLocationTask';
import {
  LiveWorkoutSession,
  readLiveSession,
  writeLiveSession,
  clearLiveSession,
  createLiveSession,
  activeDurationMs,
} from '../services/BackgroundWorkoutSession';
import { updateWorkoutNotification, dismissWorkoutNotification } from '../services/ActiveWorkoutNotification';
import { caloriesFromMetHours } from '../services/ActivityCalculator';

const POLL_MS = 1000;
const FOREGROUND_SERVICE_TITLE = 'LongLivy is tracking your activity';

/** Foreground-service-backed GPS options — BestForNavigation is appropriate for a live workout; see useGpsTracking's own copy for the foreground-only fallback. */
function watchOptions(label: string): Location.LocationTaskOptions {
  return {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 2,
    foregroundService: {
      notificationTitle: FOREGROUND_SERVICE_TITLE,
      notificationBody: `Tracking your ${label.toLowerCase()} — tap to open LongLivy.`,
      killServiceOnDestroy: true,
    },
  };
}

function emptyState(status: GpsTrackingStatus, message: string | null = null): GpsTrackingState {
  return {
    route: [],
    distanceMeters: null,
    movingDuration: 0,
    metHours: 0,
    elevationGainMeters: null,
    currentSpeedKmh: null,
    lastFixTimestamp: null,
    status,
    message,
  };
}

function toState(session: LiveWorkoutSession, status: GpsTrackingStatus): GpsTrackingState {
  return {
    route: session.route,
    distanceMeters: session.distanceMeters,
    movingDuration: session.movingDurationMs,
    metHours: session.metHours,
    elevationGainMeters: session.elevationGainMeters,
    currentSpeedKmh: status === 'tracking' ? session.currentSpeedKmh : null,
    lastFixTimestamp: session.route.length > 0 ? new Date(session.route[session.route.length - 1].timestamp).getTime() : null,
    status,
    message: session.gpsUnavailableReason,
  };
}

/**
 * Same external shape as `useGpsTracking`, but backed by a real Android
 * foreground service (via `expo-location`'s `startLocationUpdatesAsync` +
 * the `expo-task-manager` task defined in BackgroundLocationTask.ts) instead
 * of a foreground-only `watchPositionAsync` subscription. Distance, calories
 * and voice milestones all keep advancing with the screen locked or another
 * app in front — the background task is the single writer of the persisted
 * session; this hook only starts/stops the OS-level tracking and polls that
 * session to mirror it into React state while the screen is open.
 */
export function useBackgroundGpsTracking(
  enabled: boolean,
  isActive: boolean,
  activityId: string | null,
  userId: string,
  activityType: ActivityType,
  weightKg: number | null,
  activityLabel: string
): GpsTrackingState {
  const [state, setState] = useState<GpsTrackingState>(() => emptyState('idle'));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedTaskRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopTask = useCallback(async () => {
    if (!startedTaskRef.current) return;
    startedTaskRef.current = false;
    try {
      const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch {
      // Already stopped, or the OS already tore it down — nothing to do.
    }
  }, []);

  const pollOnce = useCallback(async () => {
    const session = await readLiveSession();
    if (!session || session.activityId !== activityId) return;
    const status: GpsTrackingStatus = session.status === 'paused' ? 'paused' : session.gpsUnavailableReason ? 'poor_signal' : 'tracking';
    setState(toState(session, status));
  }, [activityId]);

  // Start/stop the foreground service strictly on enabled + isActive, mirroring useGpsTracking's own contract.
  useEffect(() => {
    let cancelled = false;

    async function syncTaskToIsActive() {
      if (!enabled || !activityId) {
        await stopTask();
        stopPolling();
        if (!cancelled) setState(emptyState('idle'));
        return;
      }

      if (!isActive) {
        // Paused: stop the OS-level updates (no battery cost, guarantees no accumulation) but keep polling so the UI reflects the final pre-pause snapshot.
        await stopTask();
        const session = await readLiveSession();
        if (!cancelled && session && session.activityId === activityId) setState(toState(session, 'paused'));
        return;
      }

      setState((prev) => ({ ...prev, status: 'requesting_permission', message: null }));
      let existing = await readLiveSession();
      if (!existing || existing.activityId !== activityId) {
        existing = createLiveSession({ activityId, userId, type: activityType, startedAt: new Date().toISOString(), weightKg });
      } else {
        // Resuming after a pause: mark the resume boundary so the background
        // task breaks the segment instead of connecting it to the pre-pause fix.
        existing = { ...existing, status: 'active', pauseDurationMs: existing.pauseDurationMs + (existing.pauseStartedAt ? Date.now() - new Date(existing.pauseStartedAt).getTime() : 0), pauseStartedAt: null, pendingSegmentBreak: true };
      }
      await writeLiveSession(existing);
      await updateWorkoutNotification(existing, activeDurationMs(existing), caloriesFromMetHours(existing.metHours, existing.weightKg));

      try {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, watchOptions(activityLabel));
        startedTaskRef.current = true;
        if (!cancelled) setState(toState(existing, 'tracking'));
      } catch {
        if (!cancelled) setState(emptyState('unavailable', 'Unable to start background location tracking.'));
        return;
      }

      stopPolling();
      pollRef.current = setInterval(pollOnce, POLL_MS);
    }

    void syncTaskToIsActive();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isActive, activityId]);

  // On unmount (navigating away while a workout stays running in the background), keep the OS task alive — only stop polling the React state.
  useEffect(() => stopPolling, [stopPolling]);

  return state;
}

/** Called from endActivityThunk's caller once the activity is actually finalized — stops the service and clears the persisted session and notification. */
export async function finalizeBackgroundTracking(): Promise<void> {
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    // Already stopped.
  }
  await dismissWorkoutNotification();
  await clearLiveSession();
}

/** Used on app launch / Activity tab mount to reconnect to a session that outlived the RN process. */
export async function reconnectBackgroundSession(): Promise<LiveWorkoutSession | null> {
  return readLiveSession();
}
