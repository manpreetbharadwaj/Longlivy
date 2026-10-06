import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActivityRepositoryCore, type ActivityRecordBacking } from '../src/features/activity/repository/ActivityRepositoryCore';
import type { Activity, GpsPoint } from '../src/features/activity/models';
import type { ActivityTrackingSnapshot } from '../src/features/activity/repository/ActivityRepository';

class MemoryBacking implements ActivityRecordBacking {
  constructor(private records: Activity[] = []) {}

  async read(): Promise<Activity[]> {
    return this.records;
  }

  async write(value: Activity[]): Promise<void> {
    // A real backing is asynchronous; retaining the delay here makes lost
    // read/modify/write updates observable if repository operations race.
    await new Promise((resolve) => setTimeout(resolve, 1));
    this.records = value;
  }
}

const point = (timestamp: string, segmentStart = false): GpsPoint => ({
  latitude: 40,
  longitude: -73,
  timestamp,
  accuracy: 4,
  segmentStart,
});

const snapshot = (timestamp: string, metHours = 1): ActivityTrackingSnapshot => ({
  distanceMeters: 1_000,
  elevationGainMeters: 12,
  route: [point(timestamp, true)],
  gpsUnavailableReason: null,
  movingDuration: 10 * 60 * 1000,
  metHours,
});

function repository(backing = new MemoryBacking()) {
  let now = Date.parse('2026-01-01T00:00:00.000Z');
  let ids = 0;
  const core = new ActivityRepositoryCore({
    backing,
    clock: () => now,
    id: () => `activity_test_${++ids}`,
  });
  return {
    core,
    backing,
    advance: (milliseconds: number) => { now += milliseconds; },
    setTime: (iso: string) => { now = Date.parse(iso); },
  };
}

test('pause/resume timing excludes an open and a closed pause', async () => {
  const testRepo = repository();
  const started = await testRepo.core.startActivity('user-1', 'running', false, {
    startedAt: '2026-01-01T00:00:00.000Z',
    weightKg: 75,
  });
  testRepo.advance(10_000);
  await testRepo.core.pauseActivity(started.id);
  testRepo.advance(20_000);
  const resumed = await testRepo.core.resumeActivity(started.id);
  assert.equal(resumed.pauseDuration, 20_000);
  testRepo.advance(10_000);
  const ended = await testRepo.core.endActivity(started.id, { endedAt: '2026-01-01T00:00:40.000Z' });
  assert.equal(ended.activeDuration, 20_000);
  assert.equal(ended.pauseDuration, 20_000);
});

test('ending while paused uses endedAt rather than save latency', async () => {
  const testRepo = repository();
  const started = await testRepo.core.startActivity('user-1', 'walking', false, {
    startedAt: '2026-01-01T00:00:00.000Z',
    weightKg: 70,
  });
  await testRepo.core.pauseActivity(started.id, { pausedAt: '2026-01-01T00:00:10.000Z' });
  testRepo.setTime('2026-01-01T02:00:00.000Z');
  const ended = await testRepo.core.endActivity(started.id, { endedAt: '2026-01-01T00:00:40.000Z' });
  assert.equal(ended.activeDuration, 10_000);
  assert.equal(ended.pauseDuration, 30_000);
});

test('history is account-scoped and exact old demo seeds are removed only', async () => {
  const seed = (id: string, userId: string): Activity => ({
    id,
    userId,
    type: 'other',
    startTimestamp: '2025-01-01T00:00:00.000Z',
    endTimestamp: '2025-01-01T00:01:00.000Z',
    activeDuration: 60_000,
    pauseDuration: 0,
    distanceMeters: null,
    pace: null,
    speed: null,
    calories: null,
    calorieSource: null,
    elevationGainMeters: null,
    route: null,
    gpsAvailable: false,
    source: 'manual',
    status: 'completed',
    createdAt: '2025-01-01T00:00:00.000Z',
  });
  const backing = new MemoryBacking([seed('act_seed_1', 'demo'), seed('act_seed_2', 'demo'), seed('real_record', 'user-a')]);
  const testRepo = repository(backing);
  assert.equal((await testRepo.core.getHistory('demo')).length, 0);
  assert.equal((await testRepo.core.getHistory('user-a')).map((item) => item.id).join(','), 'real_record');
  assert.equal((await backing.read()).some((item) => item.id === 'real_record'), true);
  assert.equal((await backing.read()).some((item) => item.id === 'act_seed_1'), false);
});

test('final GPS checkpoint is persisted and GPS calories use integrated MET-hours', async () => {
  const testRepo = repository();
  const started = await testRepo.core.startActivity('user-1', 'running', true, {
    startedAt: '2026-01-01T00:00:00.000Z',
    weightKg: 80,
  });
  await testRepo.core.updateTrackingSnapshot(started.id, snapshot('2026-01-01T00:10:00.000Z', 1));
  const final = snapshot('2026-01-01T00:20:00.000Z', 2.5);
  const ended = await testRepo.core.endActivity(started.id, {
    endedAt: '2026-01-01T00:30:00.000Z',
    gps: final,
  });
  assert.deepEqual(ended.route, final.route);
  assert.equal(ended.route?.[0].segmentStart, true);
  assert.equal(ended.movingDuration, final.movingDuration);
  assert.equal(ended.metHours, 2.5);
  assert.equal(ended.calories, 200);
  const history = await testRepo.core.getHistory('user-1');
  assert.equal(history[0].calories, 200);
  assert.deepEqual(history[0].route, final.route);
});

test('serialized end wins over a late snapshot and does not get rewritten', async () => {
  const testRepo = repository();
  const started = await testRepo.core.startActivity('user-1', 'running', true, {
    startedAt: '2026-01-01T00:00:00.000Z',
    weightKg: 80,
  });
  const ending = testRepo.core.endActivity(started.id, {
    endedAt: '2026-01-01T00:01:00.000Z',
    gps: snapshot('2026-01-01T00:01:00.000Z', 2),
  });
  const lateSnapshot = testRepo.core.updateTrackingSnapshot(started.id, snapshot('2026-01-01T00:02:00.000Z', 9));
  const [ended] = await Promise.all([ending, lateSnapshot]);
  assert.equal(ended.status, 'completed');
  const persisted = (await testRepo.core.getHistory('user-1'))[0];
  assert.equal(persisted.metHours, 2);
  assert.equal(persisted.status, 'completed');
});

test('manual records cannot retain GPS source data', async () => {
  const testRepo = repository();
  const manual = await testRepo.core.logManualActivity({
    userId: 'user-1',
    type: 'other',
    startTimestamp: '2026-01-01T00:00:00.000Z',
    endTimestamp: '2026-01-01T00:10:00.000Z',
    activeDuration: 600_000,
    pauseDuration: 0,
    distanceMeters: 500,
    pace: 20,
    speed: 3,
    calories: 40,
    calorieSource: 'manual',
    elevationGainMeters: 10,
    route: [point('2026-01-01T00:01:00.000Z')],
    gpsAvailable: true,
    source: 'tracked',
  });
  assert.equal(manual.source, 'manual');
  assert.equal(manual.gpsAvailable, false);
  assert.equal(manual.route, null);
});

test('an active record recovered by a new repository instance becomes paused at its checkpoint', async () => {
  const backing = new MemoryBacking();
  const first = repository(backing);
  const started = await first.core.startActivity('user-1', 'running', true, { startedAt: '2026-01-01T00:00:00.000Z' });
  first.setTime('2026-01-01T00:05:00.000Z');
  await first.core.updateTrackingSnapshot(started.id, snapshot('2026-01-01T00:05:00.000Z'));
  const restarted = repository(backing);
  restarted.setTime('2026-01-01T04:00:00.000Z');
  const active = await restarted.core.getActiveActivity('user-1');
  assert.equal(active?.status, 'paused');
  assert.equal(active?.pauseStartedTimestamp, '2026-01-01T00:05:00.000Z');
  assert.equal(active?.activeDuration, 300_000);
});
