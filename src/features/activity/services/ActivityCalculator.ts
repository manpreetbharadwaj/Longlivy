import { ActivityType } from '../models';

/** Rough MET-based estimate — isolated so the algorithm can be swapped/versioned later. */
const MET_VALUES: Record<ActivityType, number> = {
  running: 9.8,
  walking: 3.5,
  cycling: 7.5,
  hiking: 6,
  jogging: 7,
  other: 4,
};

export const ACTIVITY_CALCULATION_METHOD = 'MET_estimate';
export const ACTIVITY_CALCULATION_VERSION = '1.0';

export function estimateActivityCalories(type: ActivityType, durationMs: number, weightKg: number): number {
  const hours = durationMs / (1000 * 60 * 60);
  const met = MET_VALUES[type];
  return Math.round(met * weightKg * hours);
}

export function calculatePace(distanceMeters: number, durationMs: number): number | null {
  if (distanceMeters <= 0) return null;
  const km = distanceMeters / 1000;
  const minutes = durationMs / 60000;
  return minutes / km; // min per km
}

export function calculateSpeed(distanceMeters: number, durationMs: number): number | null {
  if (durationMs <= 0) return null;
  const km = distanceMeters / 1000;
  const hours = durationMs / (1000 * 60 * 60);
  return km / hours;
}
