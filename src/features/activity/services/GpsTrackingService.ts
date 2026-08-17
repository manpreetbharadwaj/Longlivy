import { GpsPoint } from '../models';

export const GPS_CALCULATION_METHOD = 'haversine';
export const GPS_CALCULATION_VERSION = '1.0';

/** Points reporting worse accuracy than this (meters) are treated as noise, not a real fix. */
const MAX_ACCEPTABLE_ACCURACY_METERS = 35;
/** A jump further than this between consecutive points in under a second is a GPS glitch, not real movement. */
const MAX_PLAUSIBLE_SPEED_MPS = 12; // ~43 km/h — generous for running/cycling, filters teleporting fixes

const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates. */
export function haversineDistanceMeters(a: GpsPoint, b: GpsPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_METERS * c;
}

/** True if a point is precise enough to trust for distance/route math. */
export function isUsableFix(point: GpsPoint): boolean {
  return point.accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS;
}

/**
 * True if the jump from `prev` to `next` is physically plausible for the
 * elapsed time — rejects the "teleporting" fixes that a filtered-but-still-
 * noisy GPS signal occasionally produces, so a single bad sample can't
 * silently inflate the route with distance that was never actually covered.
 */
function isPlausibleSegment(prev: GpsPoint, next: GpsPoint, distanceMeters: number): boolean {
  const elapsedSeconds = Math.max(1, (new Date(next.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000);
  return distanceMeters / elapsedSeconds <= MAX_PLAUSIBLE_SPEED_MPS;
}

export interface RouteMetrics {
  distanceMeters: number;
  elevationGainMeters: number;
  usablePointCount: number;
}

/**
 * Recomputes distance and elevation gain from a full point log — always
 * from scratch, never by trusting an incrementally-summed running total, so
 * the same route always yields the same numbers regardless of how tracking
 * was paused/resumed along the way.
 *
 * Deliberately conservative: unusable/implausible fixes are skipped rather
 * than corrected or guessed at. The spec is explicit that GPS-based values
 * must never be invented when the signal doesn't support them.
 */
export function buildRouteMetrics(points: GpsPoint[]): RouteMetrics {
  const usable = points.filter(isUsableFix);
  let distanceMeters = 0;
  let elevationGainMeters = 0;

  for (let i = 1; i < usable.length; i++) {
    const prev = usable[i - 1];
    const next = usable[i];
    const segment = haversineDistanceMeters(prev, next);
    if (!isPlausibleSegment(prev, next, segment)) continue;

    distanceMeters += segment;
    if (prev.elevation != null && next.elevation != null) {
      const gain = next.elevation - prev.elevation;
      if (gain > 0) elevationGainMeters += gain;
    }
  }

  return {
    distanceMeters: Math.round(distanceMeters),
    elevationGainMeters: Math.round(elevationGainMeters),
    usablePointCount: usable.length,
  };
}
