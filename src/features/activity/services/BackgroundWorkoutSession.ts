import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityType, GpsPoint } from '../models';
import { GpsSessionTracker } from './GpsTrackingService';

/**
 * The live workout session, persisted on every update so it survives the RN
 * process being recreated (screen lock, backgrounding, a JS reload) and so
 * the background location task and the foreground UI — two separate JS
 * contexts — can read/write the same state. Deliberately bypasses
 * `LocalStore`'s in-memory cache (see its own file): that cache is per-JS-
 * context, so a stale read here would show the UI an outdated snapshot after
 * the background task has already moved the runner another 200 meters.
 */
export interface LiveWorkoutSession {
  activityId: string;
  userId: string;
  type: ActivityType;
  startedAt: string;
  status: 'active' | 'paused';
  pauseStartedAt: string | null;
  /** Total paused time before the current pause (if any), ms. */
  pauseDurationMs: number;
  weightKg: number | null;
  route: GpsPoint[];
  distanceMeters: number | null;
  movingDurationMs: number;
  metHours: number;
  elevationGainMeters: number | null;
  currentSpeedKmh: number | null;
  gpsUnavailableReason: string | null;
  /** Set on resume (and on the very first point): the background task rebuilds a fresh in-memory tracker from `route` on every invocation, so this is how "don't connect the post-pause fix to the pre-pause anchor" survives that rebuild — see BackgroundLocationTask.ts. */
  pendingSegmentBreak: boolean;
  /** Largest whole-km milestone already announced, so a GPS jump from 0.98 -> 1.03 km announces once, not twice. */
  lastAnnouncedDistanceKm: number;
  /** Largest whole-minute-interval milestone already announced. */
  lastAnnouncedTimeMinutes: number;
  updatedAt: string;
}

const SESSION_KEY = '@longlivy/live_workout_session';

export async function readLiveSession(): Promise<LiveWorkoutSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LiveWorkoutSession) : null;
  } catch {
    return null;
  }
}

export async function writeLiveSession(session: LiveWorkoutSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, updatedAt: new Date().toISOString() }));
  } catch {
    // Best-effort — a dropped write just means the next location update retries it.
  }
}

export async function clearLiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // Best-effort.
  }
}

export function createLiveSession(input: {
  activityId: string;
  userId: string;
  type: ActivityType;
  startedAt: string;
  weightKg: number | null;
}): LiveWorkoutSession {
  return {
    activityId: input.activityId,
    userId: input.userId,
    type: input.type,
    startedAt: input.startedAt,
    status: 'active',
    pauseStartedAt: null,
    pauseDurationMs: 0,
    weightKg: input.weightKg,
    route: [],
    distanceMeters: null,
    movingDurationMs: 0,
    metHours: 0,
    elevationGainMeters: null,
    currentSpeedKmh: null,
    gpsUnavailableReason: null,
    pendingSegmentBreak: false,
    lastAnnouncedDistanceKm: 0,
    lastAnnouncedTimeMinutes: 0,
    updatedAt: input.startedAt,
  };
}

/** Rebuilds a tracker from a persisted session — `GpsSessionTracker` replays `route` through the same filtering rules it used live, so no separate anchor state needs to survive a process restart. */
export function trackerFromSession(session: LiveWorkoutSession): GpsSessionTracker {
  return new GpsSessionTracker(session.type, {
    route: session.route,
    distanceMeters: session.distanceMeters,
    movingDuration: session.movingDurationMs,
    metHours: session.metHours,
    elevationGainMeters: session.elevationGainMeters,
  });
}

/** Active duration excludes the open pause (if any) and all past pauses. */
export function activeDurationMs(session: LiveWorkoutSession, now: number = Date.now()): number {
  const elapsedSincePause = session.pauseStartedAt ? now - new Date(session.pauseStartedAt).getTime() : 0;
  const totalPaused = session.pauseDurationMs + (session.status === 'paused' ? elapsedSincePause : 0);
  return Math.max(0, now - new Date(session.startedAt).getTime() - totalPaused);
}
