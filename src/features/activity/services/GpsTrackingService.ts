import { ActivityType, GpsPoint } from '../models';
import { getActivityMet } from './ActivityCalculator';

export const GPS_CALCULATION_METHOD = 'haversine';
export const GPS_CALCULATION_VERSION = '2.0';

const MAX_ACCEPTABLE_ACCURACY_METERS = 35;
const MAX_SEGMENT_GAP_MS = 15_000;
const STATIONARY_SPEED_MPS = 0.3;
const MIN_DEADBAND_METERS = 2;
const MAX_DEADBAND_METERS = 6;
const EARTH_RADIUS_METERS = 6_371_000;

const MAX_SPEED_MPS: Record<ActivityType, number> = {
  walking: 6,
  hiking: 6,
  running: 12,
  jogging: 12,
  cycling: 25,
  other: 12,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function timestampMs(timestamp: string): number | null {
  const value = new Date(timestamp).getTime();
  return Number.isFinite(value) ? value : null;
}

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/** Great-circle distance between two valid coordinates. Invalid coordinates contribute no distance. */
export function haversineDistanceMeters(a: GpsPoint, b: GpsPoint): number {
  if (!a || !b || !isValidCoordinate(a.latitude, a.longitude) || !isValidCoordinate(b.latitude, b.longitude)) return 0;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const boundedH = Math.min(1, Math.max(0, h));
  return EARTH_RADIUS_METERS * (2 * Math.atan2(Math.sqrt(boundedH), Math.sqrt(1 - boundedH)));
}

/** True for fixes that have trustworthy coordinates, timestamp, and horizontal accuracy. */
export function isUsableFix(point: GpsPoint): boolean {
  return Boolean(point) && isValidCoordinate(point.latitude, point.longitude)
    && Number.isFinite(point.accuracy) && point.accuracy > 0 && point.accuracy <= MAX_ACCEPTABLE_ACCURACY_METERS
    && timestampMs(point.timestamp) !== null;
}

export function maxSpeedForActivity(type: ActivityType): number {
  return MAX_SPEED_MPS[type];
}

function deadbandMeters(point: GpsPoint): number {
  return Math.max(MIN_DEADBAND_METERS, Math.min(MAX_DEADBAND_METERS, point.accuracy * 0.25));
}

function segmentElapsedMs(previous: GpsPoint, next: GpsPoint): number | null {
  const previousMs = timestampMs(previous.timestamp);
  const nextMs = timestampMs(next.timestamp);
  if (previousMs === null || nextMs === null || nextMs <= previousMs) return null;
  return nextMs - previousMs;
}

/** True when a segment does not exceed the generic legacy speed limit. */
export function isPlausibleSegment(prev: GpsPoint, next: GpsPoint, distanceMeters = haversineDistanceMeters(prev, next)): boolean {
  if (!isUsableFix(prev) || !isUsableFix(next) || next.segmentStart) return false;
  const elapsedMs = segmentElapsedMs(prev, next);
  return elapsedMs !== null && Number.isFinite(distanceMeters) && distanceMeters >= 0
    && distanceMeters / (elapsedMs / 1000) <= MAX_SPEED_MPS.running;
}

/** Speed from coordinates and timestamps, retained for existing callers. */
export function calculateSegmentSpeedKmh(prev: GpsPoint, next: GpsPoint): number | null {
  if (!isPlausibleSegment(prev, next)) return null;
  const elapsedMs = segmentElapsedMs(prev, next)!;
  return (haversineDistanceMeters(prev, next) / (elapsedMs / 1000)) * 3.6;
}

function geographicSpeedMps(previous: GpsPoint, next: GpsPoint, distanceMeters: number): number | null {
  const elapsedMs = segmentElapsedMs(previous, next);
  return elapsedMs === null ? null : distanceMeters / (elapsedMs / 1000);
}

function selectedSpeedMps(point: GpsPoint, geographicMps: number, maximumMps: number): number {
  const deviceMps = point.speed;
  const deviceIsUsable = point.accuracy <= 15 && typeof deviceMps === 'number' && Number.isFinite(deviceMps)
    && deviceMps >= 0 && deviceMps <= maximumMps;
  if (!deviceIsUsable) return geographicMps;
  const agreementTolerance = Math.max(0.25, geographicMps * 0.5);
  return Math.abs(deviceMps - geographicMps) <= agreementTolerance ? deviceMps : geographicMps;
}

function reliableAltitude(point: GpsPoint): boolean {
  return typeof point.elevation === 'number' && Number.isFinite(point.elevation)
    && typeof point.altitudeAccuracy === 'number' && Number.isFinite(point.altitudeAccuracy)
    && point.altitudeAccuracy >= 0 && point.altitudeAccuracy <= 8;
}

function addReliableElevation(previous: GpsPoint, next: GpsPoint, distanceMeters: number, current: number | null): number | null {
  if (!reliableAltitude(previous) || !reliableAltitude(next)) return current;
  const result = current ?? 0;
  const gain = next.elevation! - previous.elevation!;
  const threshold = Math.max(3, 2 * Math.max(previous.altitudeAccuracy!, next.altitudeAccuracy!));
  const grade = Math.abs(gain) / Math.max(distanceMeters, 1);
  if (gain >= threshold && grade <= 0.5) return result + gain;
  return result;
}

function appendSegmentStart(point: GpsPoint): GpsPoint {
  return point.segmentStart ? { ...point } : { ...point, segmentStart: true };
}

/** Filters persisted fixes using the same conservative engine rules as tracking. */
export function filterGpsPoints(points: GpsPoint[], type: ActivityType = 'running'): GpsPoint[] {
  return new GpsSessionTracker(type, { route: points }).snapshot().route;
}

export interface RouteMetrics {
  distanceMeters: number;
  elevationGainMeters: number | null;
  usablePointCount: number;
}

export interface GpsSessionTrackerInitial {
  route?: GpsPoint[] | null;
  distanceMeters?: number | null;
  movingDuration?: number;
  metHours?: number;
  elevationGainMeters?: number | null;
}

export interface GpsSessionSnapshot {
  route: GpsPoint[];
  distanceMeters: number | null;
  movingDuration: number;
  metHours: number;
  elevationGainMeters: number | null;
  currentSpeedKmh: number | null;
  lastFixTimestamp: number | null;
}

/**
 * Incremental, deterministic GPS engine. Rejected fixes never replace the
 * trusted comparison anchor, so a teleporting sample cannot poison recovery.
 */
export class GpsSessionTracker {
  private readonly type: ActivityType;
  private route: GpsPoint[];
  private distanceMeters: number | null;
  private movingDuration: number;
  private metHours: number;
  private elevationGainMeters: number | null;
  private anchor: GpsPoint | null;
  private previousFix: GpsPoint | null = null;
  private altitudeAnchor: GpsPoint | null = null;
  private lastObservedTimestamp: number | null;
  private lastFixTimestamp: number | null;
  private segmentOpen = true;
  private smoothedSpeedKmh: number | null = null;
  private hasMovingSpeed = false;

  constructor(type: ActivityType, initial: GpsSessionTrackerInitial = {}) {
    this.type = type;
    this.route = [];
    this.anchor = null;
    this.lastObservedTimestamp = null;
    this.lastFixTimestamp = null;
    this.distanceMeters = null;
    this.movingDuration = 0;
    this.metHours = 0;
    this.elevationGainMeters = null;
    for (const point of initial.route ?? []) this.addPoint(point);
    if (initial.distanceMeters !== undefined) this.distanceMeters = validNonNegative(initial.distanceMeters);
    if (initial.movingDuration !== undefined) this.movingDuration = validDuration(initial.movingDuration);
    if (initial.metHours !== undefined) this.metHours = validNonNegative(initial.metHours) ?? 0;
    if (initial.elevationGainMeters !== undefined) this.elevationGainMeters = validNonNegative(initial.elevationGainMeters);
  }

  addPoint(point: GpsPoint): { accepted: boolean; reason: string | null } {
    if (!isValidCoordinate(point?.latitude, point?.longitude)) {
      this.breakSegment();
      return { accepted: false, reason: 'invalid_coordinate' };
    }
    if (!Number.isFinite(point.accuracy) || point.accuracy <= 0 || point.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS) {
      this.breakSegment();
      return { accepted: false, reason: 'invalid_accuracy' };
    }
    const pointTimestamp = timestampMs(point.timestamp);
    if (pointTimestamp === null) {
      this.breakSegment();
      return { accepted: false, reason: 'invalid_timestamp' };
    }
    if (this.lastObservedTimestamp !== null && pointTimestamp <= this.lastObservedTimestamp) {
      return { accepted: false, reason: 'out_of_order_timestamp' };
    }
    this.lastObservedTimestamp = pointTimestamp;

    if (!this.anchor) {
      this.acceptNewSegment(point);
      return { accepted: true, reason: null };
    }

    const elapsedMs = segmentElapsedMs(this.anchor, point);
    const signalGapMs = this.lastFixTimestamp == null ? 0 : pointTimestamp - this.lastFixTimestamp;
    if (point.segmentStart || !this.segmentOpen || elapsedMs === null || signalGapMs > MAX_SEGMENT_GAP_MS) {
      this.acceptNewSegment(point);
      return { accepted: true, reason: 'segment_break' };
    }

    const distance = haversineDistanceMeters(this.anchor, point);
    const geographicMps = geographicSpeedMps(this.anchor, point, distance)!;
    const maximum = maxSpeedForActivity(this.type);
    const immediateDistance = this.previousFix ? haversineDistanceMeters(this.previousFix, point) : distance;
    const immediateMps = this.previousFix ? geographicSpeedMps(this.previousFix, point, immediateDistance)! : geographicMps;
    if (geographicMps > maximum || immediateMps > maximum) return { accepted: false, reason: 'impossible_jump' };

    this.previousFix = point;
    this.lastFixTimestamp = pointTimestamp;
    const reliableDeviceStop = point.accuracy <= 15 && typeof point.speed === 'number'
      && Number.isFinite(point.speed) && point.speed >= 0 && point.speed < STATIONARY_SPEED_MPS;
    if ((reliableDeviceStop && distance <= deadbandMeters(point)) || immediateMps < STATIONARY_SPEED_MPS) {
      // Retain a real stationary fix as the next anchor, never rewrite a past
      // route point with this fix's timestamp or coordinates.
      this.anchor = point;
      this.decayTowardStationary();
      return { accepted: false, reason: distance === 0 ? 'duplicate_or_noise' : 'stationary' };
    }
    if (distance <= Math.max(deadbandMeters(this.anchor), deadbandMeters(point))) {
      // Keep the distance/time anchor while slow movement crosses the
      // deadband. Advancing its timestamp here would inflate speed and lose
      // moving duration for normal 1-metre-per-second walking.
      this.decayTowardStationary();
      return { accepted: false, reason: 'duplicate_or_noise' };
    }

    const speedMps = selectedSpeedMps(point, geographicMps, maximum);
    if (speedMps < STATIONARY_SPEED_MPS) {
      this.anchor = point;
      this.decayTowardStationary();
      return { accepted: false, reason: 'stationary' };
    }

    const speedKmh = speedMps * 3.6;
    const persistedAnchor = this.route[this.route.length - 1];
    if (
      persistedAnchor && persistedAnchor.timestamp !== this.anchor.timestamp
      && haversineDistanceMeters(persistedAnchor, this.anchor) > Math.max(deadbandMeters(persistedAnchor), deadbandMeters(this.anchor))
    ) {
      // Preserve a meaningful stationary/signal-gap anchor in the ordered
      // route, but mark it as a segment start so recomputation skips the
      // unobserved pause leg.
      this.route.push(appendSegmentStart(this.anchor));
    }
    this.route.push({ ...point, segmentStart: false });
    this.distanceMeters = (this.distanceMeters ?? 0) + distance;
    this.movingDuration += elapsedMs;
    this.metHours += getActivityMet(this.type, speedKmh) * (elapsedMs / 3_600_000);
    if (reliableAltitude(point)) {
      if (this.altitudeAnchor) {
        this.elevationGainMeters = addReliableElevation(
          this.altitudeAnchor, point, haversineDistanceMeters(this.altitudeAnchor, point), this.elevationGainMeters,
        );
        const change = Math.abs(point.elevation! - this.altitudeAnchor.elevation!);
        const threshold = Math.max(3, 2 * Math.max(point.altitudeAccuracy!, this.altitudeAnchor.altitudeAccuracy!));
        if (change >= threshold) this.altitudeAnchor = point;
      } else this.altitudeAnchor = point;
    } else this.altitudeAnchor = null;
    this.anchor = point;
    this.lastFixTimestamp = pointTimestamp;
    this.segmentOpen = true;
    this.smoothedSpeedKmh = this.hasMovingSpeed && this.smoothedSpeedKmh != null
      ? this.smoothedSpeedKmh * 0.65 + speedKmh * 0.35
      : speedKmh;
    this.hasMovingSpeed = true;
    return { accepted: true, reason: null };
  }

  breakSegment(): void {
    this.segmentOpen = false;
    this.previousFix = null;
    this.altitudeAnchor = null;
    this.smoothedSpeedKmh = 0;
    this.hasMovingSpeed = false;
  }

  snapshot(): GpsSessionSnapshot {
    return {
      route: this.route.map((point) => ({ ...point })),
      distanceMeters: this.distanceMeters,
      movingDuration: this.movingDuration,
      metHours: this.metHours,
      elevationGainMeters: this.elevationGainMeters,
      currentSpeedKmh: this.smoothedSpeedKmh,
      lastFixTimestamp: this.lastFixTimestamp,
    };
  }

  private acceptNewSegment(point: GpsPoint): void {
    const accepted = appendSegmentStart(point);
    this.route.push(accepted);
    this.anchor = accepted;
    this.previousFix = accepted;
    this.altitudeAnchor = reliableAltitude(accepted) ? accepted : null;
    this.lastFixTimestamp = timestampMs(accepted.timestamp);
    this.distanceMeters = this.distanceMeters ?? 0;
    this.segmentOpen = true;
    this.smoothedSpeedKmh = 0;
    this.hasMovingSpeed = false;
  }

  private decayTowardStationary(): void {
    this.smoothedSpeedKmh = this.smoothedSpeedKmh == null ? 0 : this.smoothedSpeedKmh * 0.65;
    if (this.smoothedSpeedKmh < 0.01) this.smoothedSpeedKmh = 0;
  }

}

function validNonNegative(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function validDuration(value: number | null | undefined): number {
  return validNonNegative(value) ?? 0;
}

/** Recomputes persisted routes through the same filtering rules as live tracking. */
export function buildRouteMetrics(points: GpsPoint[], type: ActivityType = 'running'): RouteMetrics {
  const tracker = new GpsSessionTracker(type, { route: points });
  const snapshot = tracker.snapshot();
  return {
    distanceMeters: snapshot.distanceMeters ?? 0,
    elevationGainMeters: snapshot.elevationGainMeters,
    usablePointCount: snapshot.route.length,
  };
}
