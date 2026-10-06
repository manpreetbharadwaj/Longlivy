import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateActiveDurationMs,
  calculateCurrentPace,
  calculatePace,
  calculateSpeed,
  caloriesFromMetHours,
  estimateActivityCalories,
  formatActivityDuration,
  formatActivityPace,
  getActivityActiveDuration,
  getActivityMet,
  resolveActivityWeightKg,
} from '../src/features/activity/services/ActivityCalculator';

test('calculates the required five-kilometre pace and speed', () => {
  assert.equal(calculatePace(5_000, 25 * 60_000), 5);
  assert.equal(calculateSpeed(5_000, 30 * 60_000), 10);
  assert.equal(calculatePace(0.5, 60_000), null);
  assert.equal(calculateSpeed(0, 60_000), null);
});

test('does not invent calories when weight is absent or invalid', () => {
  assert.equal(resolveActivityWeightKg(null), null);
  assert.equal(resolveActivityWeightKg(undefined), null);
  assert.equal(resolveActivityWeightKg(Number.NaN), null);
  assert.equal(estimateActivityCalories('running', 30 * 60_000, null), null);
  assert.equal(caloriesFromMetHours(2, undefined), null);
  assert.equal(caloriesFromMetHours(0, 70), 0);
});

test('activity-specific METs vary by speed and calories scale with real weight', () => {
  const walking = getActivityMet('walking', 5);
  const running = getActivityMet('running', 10);
  assert.ok(running > walking);
  assert.equal(getActivityMet('running', 0.5), 1);

  const light = estimateActivityCalories('running', 60 * 60_000, 60, { speedKmh: 10 });
  const heavy = estimateActivityCalories('running', 60 * 60_000, 90, { speedKmh: 10 });
  assert.notEqual(light, null);
  assert.notEqual(heavy, null);
  assert.equal(heavy, Math.round(light! * 1.5));
  assert.ok(heavy! > light!);
  assert.equal(estimateActivityCalories('walking', 60 * 60_000, { weightKg: 70, speedKmh: 5 }), estimateActivityCalories('walking', 60 * 60_000, 70, { speedKmh: 5 }));
});

test('current pace requires at least fifty metres and formats cleanly', () => {
  assert.equal(calculateCurrentPace(10, 49), null);
  assert.equal(calculateCurrentPace(10, 50), 6);
  assert.equal(formatActivityPace(5), '05:00 /km');
  assert.equal(formatActivityPace(null), '-- /km');
});

test('timestamp helpers subtract persisted and open pauses', () => {
  assert.equal(calculateActiveDurationMs('2026-01-01T00:00:00.000Z', '2026-01-01T00:35:00.000Z', 5 * 60_000), 30 * 60_000);
  assert.equal(getActivityActiveDuration({
    startTimestamp: '2026-01-01T00:00:00.000Z',
    endTimestamp: null,
    pauseDuration: 5 * 60_000,
    pauseStartedTimestamp: '2026-01-01T00:20:00.000Z',
    status: 'paused',
  }, Date.parse('2026-01-01T00:35:00.000Z')), 15 * 60_000);
});

test('duration formatting clamps malformed values', () => {
  assert.equal(formatActivityDuration(3_661_999), '01:01:01');
  assert.equal(formatActivityDuration(-1), '00:00:00');
});
