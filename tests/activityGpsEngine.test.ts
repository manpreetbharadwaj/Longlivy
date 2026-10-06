import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GpsPoint } from '../src/features/activity/models';
import {
  GpsSessionTracker,
  buildRouteMetrics,
  filterGpsPoints,
  haversineDistanceMeters,
  isPlausibleSegment,
  isUsableFix,
} from '../src/features/activity/services/GpsTrackingService';

const point = (latitude: number, longitude: number, seconds: number, extras: Partial<GpsPoint> = {}): GpsPoint => ({
  latitude,
  longitude,
  timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString(),
  accuracy: 5,
  ...extras,
});

test('haversine and fix validation handle known separation and invalid fixes', () => {
  const origin = point(0, 0, 0);
  const oneThousandth = point(0, 0.001, 60);
  assert.ok(haversineDistanceMeters(origin, oneThousandth) > 110 && haversineDistanceMeters(origin, oneThousandth) < 112);
  assert.equal(isUsableFix(point(91, 0, 1)), false);
  assert.equal(isUsableFix(point(0, 0, 1, { accuracy: 0 })), false);
  assert.equal(isUsableFix(point(0, 0, 1, { accuracy: 36 })), false);
  assert.equal(filterGpsPoints([origin, point(0, 0, 2), point(0, 0.001, 60)]).length, 2);
});

test('tracker rejects duplicates and impossible jumps without losing good continuation', () => {
  const tracker = new GpsSessionTracker('running');
  assert.equal(tracker.addPoint(point(0, 0, 0)).accepted, true);
  assert.equal(tracker.addPoint(point(0, 0, 1)).reason, 'duplicate_or_noise');
  assert.equal(tracker.addPoint(point(0, 1, 2)).reason, 'impossible_jump');
  assert.equal(tracker.addPoint(point(0, 0.0001, 3)).accepted, true);
  const snapshot = tracker.snapshot();
  assert.equal(snapshot.route.length, 2);
  assert.ok((snapshot.distanceMeters ?? 0) > 10 && (snapshot.distanceMeters ?? 0) < 13);
});

test('pause and long gaps create persisted segment starts without bridging distance or moving time', () => {
  const tracker = new GpsSessionTracker('running');
  tracker.addPoint(point(0, 0, 0));
  tracker.addPoint(point(0, 0.0001, 10));
  const beforePause = tracker.snapshot();
  tracker.breakSegment();
  assert.equal(tracker.addPoint(point(0, 0.001, 11)).reason, 'segment_break');
  const afterPause = tracker.snapshot();
  assert.equal(afterPause.distanceMeters, beforePause.distanceMeters);
  assert.equal(afterPause.movingDuration, beforePause.movingDuration);
  assert.equal(afterPause.route[afterPause.route.length - 1]?.segmentStart, true);
  assert.equal(tracker.addPoint(point(0, 0.0011, 12)).accepted, true);
  const afterResume = tracker.snapshot();
  assert.ok((afterResume.distanceMeters ?? 0) > (beforePause.distanceMeters ?? 0));
  assert.equal(tracker.addPoint(point(0, 0.002, 40)).reason, 'segment_break');
  const afterGap = tracker.snapshot();
  assert.equal(afterGap.route[afterGap.route.length - 1]?.segmentStart, true);
});

test('slow walking and stationary samples do not accrue moving time, and speed decays', () => {
  const tracker = new GpsSessionTracker('walking');
  tracker.addPoint(point(0, 0, 0));
  tracker.addPoint(point(0, 0.00003, 20));
  assert.equal(tracker.snapshot().movingDuration, 0);

  const moving = new GpsSessionTracker('running');
  moving.addPoint(point(0, 0, 0));
  moving.addPoint(point(0, 0.0001, 2));
  const speedBefore = moving.snapshot().currentSpeedKmh;
  assert.ok(speedBefore != null && speedBefore > 0);
  assert.equal(moving.addPoint(point(0, 0.0001, 3)).reason, 'duplicate_or_noise');
  const speedAfter = moving.snapshot().currentSpeedKmh;
  assert.ok(speedAfter != null && speedAfter < speedBefore);
});

test('device speed is used only when accurate and agreeing; geographic speed is the fallback', () => {
  const tracker = new GpsSessionTracker('running');
  tracker.addPoint(point(0, 0, 0));
  tracker.addPoint(point(0, 0.0001, 10, { accuracy: 20, speed: 0 }));
  const speed = tracker.snapshot().currentSpeedKmh;
  assert.ok(speed != null && speed > 0 && speed < 5);

  const disagreeing = new GpsSessionTracker('running');
  disagreeing.addPoint(point(0, 0, 0));
  disagreeing.addPoint(point(0, 0.0001, 10, { accuracy: 5, speed: 12 }));
  const derived = disagreeing.snapshot().currentSpeedKmh;
  assert.ok(derived != null && derived < 5);
});

test('only reliable altitude with hysteresis and plausible grade contributes gain', () => {
  const tracker = new GpsSessionTracker('running');
  tracker.addPoint(point(40, -73, 0, { elevation: 100, altitudeAccuracy: 2 }));
  tracker.addPoint(point(40, -72.999, 10, { elevation: 105, altitudeAccuracy: 2 }));
  tracker.addPoint(point(40, -72.998, 20, { elevation: 107, altitudeAccuracy: 2 }));
  tracker.addPoint(point(40, -72.997, 30, { elevation: 117, altitudeAccuracy: 20 }));
  assert.equal(tracker.snapshot().elevationGainMeters, 5);

  const metrics = buildRouteMetrics([
    point(0, 0, 0, { elevation: 0, altitudeAccuracy: 2 }),
    point(0, 0.001, 10, { elevation: 5, altitudeAccuracy: 2 }),
  ]);
  assert.equal(metrics.elevationGainMeters, 5);
  assert.equal(isPlausibleSegment(point(0, 0, 0), point(0, 0.001, 60)), true);
});
