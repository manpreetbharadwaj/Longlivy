import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { GpsPoint } from '../models';
import { buildRouteMetrics } from '../services/GpsTrackingService';

export type GpsTrackingStatus = 'idle' | 'requesting_permission' | 'tracking' | 'paused' | 'denied' | 'unavailable';

export interface GpsTrackingState {
  status: GpsTrackingStatus;
  route: GpsPoint[];
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  /** User-facing explanation for 'denied' | 'unavailable' — never silently swallowed, per the spec's "clear notification" requirement. */
  message: string | null;
}

const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 3000,
  distanceInterval: 5, // meters
};

/**
 * Owns the live GPS subscription for a tracked activity. Distance/elevation
 * are recomputed from the full point log on every update (see
 * GpsTrackingService) rather than incrementally summed, so pausing and
 * resuming can never silently corrupt the running total.
 *
 * On permission denial or disabled location services, this deliberately
 * lands on distanceMeters: null (not 0) — the activity can still run on
 * duration alone, but nothing GPS-based is invented to fill the gap.
 */
export function useGpsTracking(enabled: boolean, isActive: boolean): GpsTrackingState {
  const [status, setStatus] = useState<GpsTrackingStatus>('idle');
  const [route, setRoute] = useState<GpsPoint[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const pointsRef = useRef<GpsPoint[]>([]);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!enabled || !isActive) {
        stopWatching();
        setStatus((prev) => (enabled && prev !== 'denied' && prev !== 'unavailable' ? 'paused' : prev === 'idle' ? 'idle' : prev));
        return;
      }

      setStatus('requesting_permission');
      const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
      if (!servicesEnabled) {
        if (cancelled) return;
        setStatus('unavailable');
        setMessage('Location services are turned off — this activity will still track duration, but not distance or route.');
        return;
      }

      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permissionStatus !== 'granted') {
        setStatus('denied');
        setMessage('Location permission was not granted — this activity will still track duration, but not distance or route.');
        return;
      }

      subscriptionRef.current = await Location.watchPositionAsync(WATCH_OPTIONS, (location) => {
        const point: GpsPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date(location.timestamp).toISOString(),
          accuracy: location.coords.accuracy ?? 999,
          elevation: location.coords.altitude ?? undefined,
          speed: location.coords.speed ?? undefined,
        };
        pointsRef.current = [...pointsRef.current, point];
        setRoute(pointsRef.current);
      });

      if (!cancelled) setStatus('tracking');
    }

    start();
    return () => {
      cancelled = true;
      stopWatching();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isActive]);

  useEffect(() => stopWatching, [stopWatching]);

  const metrics = buildRouteMetrics(route);
  const hasAnyFix = route.length > 0;

  return {
    status,
    route,
    distanceMeters: hasAnyFix ? metrics.distanceMeters : status === 'tracking' || status === 'paused' ? 0 : null,
    elevationGainMeters: hasAnyFix ? metrics.elevationGainMeters : status === 'tracking' || status === 'paused' ? 0 : null,
    message,
  };
}
