import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { ActivityType, GpsPoint } from '../models';
import {
  GpsSessionSnapshot,
  GpsSessionTracker,
  GpsSessionTrackerInitial,
  isUsableFix,
} from '../services/GpsTrackingService';

export type GpsTrackingStatus =
  | 'idle'
  | 'requesting_permission'
  | 'tracking'
  | 'poor_signal'
  | 'paused'
  | 'denied'
  | 'unavailable';

export interface GpsTrackingState extends GpsSessionSnapshot {
  status: GpsTrackingStatus;
  /** User-facing explanation for a GPS state — never silently swallowed. */
  message: string | null;
}

/** Foreground-only settings. BestForNavigation is appropriate for a live workout. */
export const GPS_WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,
  distanceInterval: 1,
};

const DEFAULT_ACCURACY_METERS = 999;
const POOR_SIGNAL_MESSAGE = 'GPS signal is weak — distance and route will update when a reliable fix is available.';
const INVALID_LOCATION_MESSAGE = 'GPS returned an invalid location — waiting for a reliable fix.';
const JUMP_MESSAGE = 'An impossible GPS jump was ignored — waiting for a reliable fix.';

/** Converts one Expo fix into the app's serializable point format. */
export function locationToGpsPoint(location: Location.LocationObject, speedMps?: number | null): GpsPoint | null {
  const coords = location?.coords;
  if (!coords) return null;

  const latitude = coords.latitude;
  const longitude = coords.longitude;
  const timestampMs = location.timestamp;
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(timestampMs) ||
    timestampMs < 0
  ) {
    return null;
  }

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return null;

  const accuracy = typeof coords.accuracy === 'number' && Number.isFinite(coords.accuracy) && coords.accuracy >= 0
    ? coords.accuracy
    : DEFAULT_ACCURACY_METERS;
  const locationSpeed = typeof coords.speed === 'number' && Number.isFinite(coords.speed) && coords.speed >= 0 ? coords.speed : null;
  const fallbackSpeed = typeof speedMps === 'number' && Number.isFinite(speedMps) && speedMps >= 0 ? speedMps : null;
  const elevation = typeof coords.altitude === 'number' && Number.isFinite(coords.altitude) ? coords.altitude : undefined;
  const altitudeAccuracy = typeof coords.altitudeAccuracy === 'number' && Number.isFinite(coords.altitudeAccuracy) && coords.altitudeAccuracy >= 0
    ? coords.altitudeAccuracy
    : undefined;

  return {
    latitude,
    longitude,
    timestamp: date.toISOString(),
    accuracy,
    elevation,
    altitudeAccuracy,
    speed: locationSpeed ?? fallbackSpeed ?? undefined,
  };
}

function emptySnapshot(): GpsSessionSnapshot {
  return {
    route: [],
    distanceMeters: null,
    movingDuration: 0,
    metHours: 0,
    elevationGainMeters: null,
    currentSpeedKmh: null,
    lastFixTimestamp: null,
  };
}

/**
 * Owns the live foreground GPS subscription. The pure GpsSessionTracker is
 * the single source of truth for filtering, distance, speed, moving time,
 * MET-hours and pause/gap segment boundaries.
 */
export function useGpsTracking(
  enabled: boolean,
  isActive: boolean,
  speedMps?: number | null,
  initialRoute: GpsPoint[] | null = null,
  activityType: ActivityType = 'running',
  initialMetrics: Omit<GpsSessionTrackerInitial, 'route'> = {},
): GpsTrackingState {
  const trackerRef = useRef<GpsSessionTracker | null>(null);
  const trackerTypeRef = useRef<ActivityType | null>(null);
  if (trackerRef.current === null || trackerTypeRef.current !== activityType) {
    trackerRef.current = new GpsSessionTracker(activityType, {
      ...initialMetrics,
      route: initialRoute,
    });
    trackerTypeRef.current = activityType;
  }

  const [snapshot, setSnapshot] = useState<GpsSessionSnapshot>(() => trackerRef.current!.snapshot());
  const [status, setStatus] = useState<GpsTrackingStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const speedMpsRef = useRef<number | null>(null);
  const runIdRef = useRef(0);
  const receivedSampleRef = useRef(false);

  speedMpsRef.current = typeof speedMps === 'number' && Number.isFinite(speedMps) && speedMps >= 0 ? speedMps : null;

  const stopWatching = useCallback(() => {
    try {
      subscriptionRef.current?.remove();
    } catch {
      // Native cleanup is best effort if the platform already removed it.
    } finally {
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runId = ++runIdRef.current;
    stopWatching();
    receivedSampleRef.current = false;

    if (!enabled) {
      const freshTracker = new GpsSessionTracker(activityType);
      trackerRef.current = freshTracker;
      trackerTypeRef.current = activityType;
      setSnapshot(freshTracker.snapshot());
      setStatus('idle');
      setMessage(null);
      return () => {
        cancelled = true;
        stopWatching();
      };
    }

    const tracker = trackerRef.current!;
    // Closing the current segment before every pause/resume boundary prevents
    // a far-away post-pause fix from being connected to the old anchor.
    tracker.breakSegment();
    setSnapshot(tracker.snapshot());

    if (!isActive) {
      setStatus('paused');
      setMessage(null);
      return () => {
        cancelled = true;
        stopWatching();
      };
    }

    setStatus('requesting_permission');
    setMessage(null);

    async function start() {
      let servicesEnabled = false;
      try {
        servicesEnabled = await Location.hasServicesEnabledAsync();
      } catch {
        servicesEnabled = false;
      }
      if (cancelled || runIdRef.current !== runId) return;
      if (!servicesEnabled) {
        setStatus('unavailable');
        setMessage('Location services are turned off — this activity will not record distance or a route.');
        return;
      }

      let permissionStatus: Location.PermissionStatus;
      try {
        ({ status: permissionStatus } = await Location.requestForegroundPermissionsAsync());
      } catch {
        if (cancelled || runIdRef.current !== runId) return;
        setStatus('unavailable');
        setMessage('Unable to access location right now — no GPS distance or route will be recorded.');
        return;
      }
      if (cancelled || runIdRef.current !== runId) return;
      if (permissionStatus !== 'granted') {
        setStatus('denied');
        setMessage('Location permission was not granted — no fake distance or route will be recorded.');
        return;
      }

      try {
        const subscription = await Location.watchPositionAsync(
          GPS_WATCH_OPTIONS,
          (location) => {
            if (cancelled || runIdRef.current !== runId || !isActive) return;
            const point = locationToGpsPoint(location, speedMpsRef.current);
            receivedSampleRef.current = true;
            if (!point) {
              tracker.breakSegment();
              setSnapshot(tracker.snapshot());
              setStatus('poor_signal');
              setMessage(INVALID_LOCATION_MESSAGE);
              return;
            }

            const result = tracker.addPoint(point);
            const nextSnapshot = tracker.snapshot();
            if (result.accepted || result.reason === 'segment_break') setSnapshot(nextSnapshot);
            else if (result.reason === 'duplicate_or_noise' || result.reason === 'stationary') setSnapshot(nextSnapshot);

            if (result.accepted || result.reason === 'segment_break' || result.reason === 'duplicate_or_noise' || result.reason === 'stationary') {
              if (isUsableFix(point)) {
                setStatus('tracking');
                setMessage(null);
              } else {
                setStatus('poor_signal');
                setMessage(POOR_SIGNAL_MESSAGE);
              }
            } else if (result.reason === 'invalid_accuracy') {
              setStatus('poor_signal');
              setMessage(POOR_SIGNAL_MESSAGE);
            } else if (result.reason === 'impossible_jump') {
              setStatus('poor_signal');
              setMessage(JUMP_MESSAGE);
            }
          },
          (error) => {
            if (cancelled || runIdRef.current !== runId) return;
            setStatus('unavailable');
            setMessage(error || 'GPS became unavailable — waiting for a reliable signal.');
          },
        );

        if (cancelled || runIdRef.current !== runId) {
          subscription.remove();
          return;
        }
        subscriptionRef.current = subscription;
        if (!receivedSampleRef.current) setStatus('tracking');
      } catch {
        if (cancelled || runIdRef.current !== runId) return;
        setStatus('unavailable');
        setMessage('Unable to start GPS tracking — no GPS distance or route will be recorded.');
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopWatching();
    };
  }, [activityType, enabled, isActive, stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const unavailableSnapshot = !enabled ? emptySnapshot() : snapshot;
  return {
    ...unavailableSnapshot,
    currentSpeedKmh: isActive ? unavailableSnapshot.currentSpeedKmh : null,
    status,
    message,
  };
}
