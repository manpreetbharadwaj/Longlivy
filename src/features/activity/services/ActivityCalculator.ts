import { Activity, ActivityType } from '../models';

/** Baseline MET values used when no speed is available. */
const MET_VALUES: Record<ActivityType, number> = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  hiking: 6,
  jogging: 7,
  other: 4,
};

export const ACTIVITY_CALCULATION_METHOD = 'MET_estimate';
export const ACTIVITY_CALCULATION_VERSION = '3.0';
export const MIN_ACTIVITY_DISTANCE_METERS = 50;
const MIN_SPEED_DISTANCE_METERS = 1;
const STATIONARY_SPEED_KMH = 0.3 * 3.6;

export type ActivityIntensity = 'low' | 'moderate' | 'high';

export interface ActivityEstimateOptions {
  /** Supported for callers that pass the complete options object as argument three. */
  weightKg?: number | null;
  speedKmh?: number | null;
  intensity?: ActivityIntensity | number | null;
  distanceMeters?: number | null;
}

/** A profile value is usable only when it is finite and strictly positive. */
export function resolveActivityWeightKg(weightKg: number | null | undefined): number | null {
  return typeof weightKg === 'number' && Number.isFinite(weightKg) && weightKg > 0 ? weightKg : null;
}

function speedMet(type: ActivityType, speedKmh: number): number {
  if (speedKmh < STATIONARY_SPEED_KMH) return 1;

  switch (type) {
    case 'walking':
      if (speedKmh < 3) return 2.3;
      if (speedKmh < 4.8) return 3;
      if (speedKmh < 6.4) return 3.5;
      if (speedKmh < 8) return 5;
      return 6.3;
    case 'running':
    case 'jogging':
      if (speedKmh < 6.5) return type === 'jogging' ? 5.5 : 6;
      if (speedKmh < 8) return 8.3;
      if (speedKmh < 9.7) return 9.8;
      if (speedKmh < 11.3) return 10.5;
      return 11.5;
    case 'cycling':
      if (speedKmh < 10) return 4;
      if (speedKmh < 16) return 6;
      if (speedKmh < 19) return 8;
      if (speedKmh < 22) return 10;
      return 12;
    case 'hiking':
      if (speedKmh < 3.2) return 3.5;
      if (speedKmh < 4.8) return 5.3;
      if (speedKmh < 6.4) return 6;
      return 7.5;
    case 'other':
      return MET_VALUES.other;
  }
}

function intensityMultiplier(intensity: ActivityEstimateOptions['intensity']): number {
  if (intensity === 'low') return 0.85;
  if (intensity === 'high') return 1.2;
  if (intensity === 'moderate' || intensity == null) return 1;
  if (typeof intensity !== 'number' || !Number.isFinite(intensity) || intensity <= 0) return 1;
  if (intensity <= 1) return 0.85 + intensity * 0.35;
  if (intensity <= 3) return 0.85 + ((intensity - 1) / 2) * 0.35;
  return Math.min(intensity, 2);
}

/** Returns the activity-specific MET for speed and optional effort intensity. */
export function getActivityMet(
  type: ActivityType,
  speedKmh?: number | null,
  intensity?: ActivityEstimateOptions['intensity']
): number {
  const hasSpeed = typeof speedKmh === 'number' && Number.isFinite(speedKmh) && speedKmh >= 0;
  if (hasSpeed && speedKmh < STATIONARY_SPEED_KMH) return 1;
  const met = hasSpeed ? speedMet(type, speedKmh) : MET_VALUES[type];
  return met * intensityMultiplier(intensity);
}

/** Gross energy during observed movement; an estimate, not measured active energy. */
export function caloriesFromMetHours(metHours: number, weightKg: number | null | undefined): number | null {
  const weight = resolveActivityWeightKg(weightKg);
  if (weight === null || !Number.isFinite(metHours) || metHours < 0) return null;
  return Math.round(metHours * weight);
}

/**
 * Keeps the original three-argument calculator and supports an options object
 * as the fourth argument. Invalid duration or weight is unavailable, not zero.
 */
export function estimateActivityCalories(
  type: ActivityType,
  durationMs: number,
  weightKgOrOptions?: number | null | ActivityEstimateOptions,
  options: ActivityEstimateOptions = {}
): number | null {
  const objectForm = typeof weightKgOrOptions === 'object' && weightKgOrOptions !== null ? weightKgOrOptions : null;
  const weightKg = objectForm !== null
    ? objectForm.weightKg
    : typeof weightKgOrOptions === 'number' || weightKgOrOptions == null ? weightKgOrOptions : null;
  const calculationOptions = objectForm ? { ...objectForm, ...options } : options;
  const weight = resolveActivityWeightKg(weightKg);
  if (weight === null || !Number.isFinite(durationMs) || durationMs < 0) return null;
  if (durationMs === 0) return 0;

  let speedKmh = calculationOptions.speedKmh;
  if ((speedKmh == null || !Number.isFinite(speedKmh)) && Number.isFinite(calculationOptions.distanceMeters) && (calculationOptions.distanceMeters ?? -1) >= 0) {
    speedKmh = (calculationOptions.distanceMeters! / 1000) / (durationMs / 3_600_000);
  }
  const metHours = getActivityMet(type, speedKmh, calculationOptions.intensity) * (durationMs / 3_600_000);
  return caloriesFromMetHours(metHours, weight);
}

export function calculatePace(distanceMeters: number, durationMs: number): number | null {
  if (!Number.isFinite(distanceMeters) || distanceMeters < MIN_ACTIVITY_DISTANCE_METERS) return null;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  const pace = (durationMs / 60_000) / (distanceMeters / 1000);
  return Number.isFinite(pace) && pace > 0 ? pace : null;
}

export function calculateSpeed(distanceMeters: number, durationMs: number): number | null {
  if (!Number.isFinite(distanceMeters) || distanceMeters < MIN_SPEED_DISTANCE_METERS) return null;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
  const speed = (distanceMeters / 1000) / (durationMs / 3_600_000);
  return Number.isFinite(speed) && speed >= 0 ? speed : null;
}

/** Formats min/km like the activity UI, or a placeholder when unavailable. */
export function formatActivityPace(minPerKm: number | null): string {
  if (minPerKm == null || !Number.isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 120) return '-- /km';
  const totalSeconds = Math.round(minPerKm * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} /km`;
}

/** Formats an elapsed duration as HH:MM:SS, clamping malformed values to zero. */
export function formatActivityDuration(durationMs: number): string {
  const totalSeconds = Number.isFinite(durationMs) && durationMs > 0 ? Math.floor(durationMs / 1000) : 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

/** Pace from a current speed, requiring a meaningful route before reporting it. */
export function calculateCurrentPace(speedKmh: number | null, distanceMeters: number | null): number | null {
  if (speedKmh == null || !Number.isFinite(speedKmh) || speedKmh <= 0 || distanceMeters == null || distanceMeters < 50) return null;
  return 60 / speedKmh;
}

/** Pure timestamp arithmetic for active duration. */
export function calculateActiveDurationMs(startTimestamp: string, endTimestamp: string, pauseDurationMs = 0): number {
  const start = new Date(startTimestamp).getTime();
  const end = new Date(endTimestamp).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  const pauses = Number.isFinite(pauseDurationMs) && pauseDurationMs > 0 ? pauseDurationMs : 0;
  return Math.max(0, end - start - pauses);
}

type ActivityDurationShape = Pick<Activity, 'startTimestamp'> & {
  endTimestamp?: string | null;
  pauseDuration?: number;
  pauseStartedTimestamp?: string | null;
  status?: Activity['status'];
};

/** Calculates active duration from persisted timestamps, including an open pause. */
export function getActivityActiveDuration(activity: ActivityDurationShape, now = Date.now()): number {
  const nowMs = Number.isFinite(now) ? now : Date.now();
  const startMs = new Date(activity.startTimestamp).getTime();
  if (!Number.isFinite(startMs)) return 0;
  const endMs = activity.endTimestamp == null ? nowMs : new Date(activity.endTimestamp).getTime();
  if (!Number.isFinite(endMs)) return 0;
  const openPauseStart = activity.status === 'paused' && activity.pauseStartedTimestamp
    ? new Date(activity.pauseStartedTimestamp).getTime()
    : NaN;
  const openPause = Number.isFinite(openPauseStart) ? Math.max(0, endMs - openPauseStart) : 0;
  return Math.max(0, endMs - startMs - Math.max(0, activity.pauseDuration ?? 0) - openPause);
}
