import type { ActivityRepository, ActivityTrackingSnapshot, EndActivityGpsSnapshot } from './ActivityRepository';
import type { Activity, ActivityType, GpsPoint } from '../models';
import {
  calculateActiveDurationMs,
  calculatePace,
  calculateSpeed,
  caloriesFromMetHours,
  estimateActivityCalories,
} from '../services/ActivityCalculator';

/**
 * The small persistence boundary used by the activity repository.  Keeping it
 * here (rather than importing AsyncStorage) makes the activity rules usable in
 * node tests and also makes the best-effort nature of the local adapter
 * explicit.
 */
export interface ActivityRecordBacking {
  read(): Promise<Activity[]>;
  write(value: Activity[]): Promise<void>;
}

export type ActivityRepositoryClock = () => Date | string | number;
export type ActivityRepositoryIdGenerator = (prefix?: string) => string;

export interface ActivityRepositoryCoreOptions {
  backing?: ActivityRecordBacking;
  read?: () => Promise<Activity[]>;
  write?: (value: Activity[]) => Promise<void>;
  clock?: ActivityRepositoryClock;
  idGenerator?: ActivityRepositoryIdGenerator;
  /** Alias retained for small consumers that call this option simply `id`. */
  id?: ActivityRepositoryIdGenerator;
}

/** Fields needed only to recover a live session after an app restart. */
type PersistedActivity = Activity & {
  lastCheckpointTimestamp?: string | null;
};

const OLD_SEED_IDS = new Set(['act_seed_1', 'act_seed_2', 'act_seed_3']);
let fallbackIdCounter = 0;

function clonePoint(point: GpsPoint): GpsPoint {
  return { ...point };
}

function cloneActivity(activity: Activity): PersistedActivity {
  return {
    ...(activity as PersistedActivity),
    route: activity.route ? activity.route.map(clonePoint) : null,
  };
}

function finiteTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveOrZero(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function hasOwn<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Pure activity persistence rules. Mutations are serialized, including the
 * read/modify/write transaction, so a late GPS checkpoint cannot race an end
 * or pause operation.
 */
export class ActivityRepositoryCore implements ActivityRepository {
  private readonly clock: ActivityRepositoryClock;
  private readonly idGenerator: ActivityRepositoryIdGenerator;
  private queue: Promise<void> = Promise.resolve();
  private readonly liveIds = new Set<string>();

  private readonly backing: ActivityRecordBacking;

  constructor(backing: ActivityRecordBacking, options?: Omit<ActivityRepositoryCoreOptions, 'backing'>);
  constructor(options: ActivityRepositoryCoreOptions);
  constructor(
    backingOrOptions: ActivityRecordBacking | ActivityRepositoryCoreOptions,
    options: Omit<ActivityRepositoryCoreOptions, 'backing'> = {},
  ) {
    const isOptions = 'backing' in backingOrOptions || 'clock' in backingOrOptions || 'idGenerator' in backingOrOptions || 'id' in backingOrOptions;
    const isBacking = !isOptions && typeof (backingOrOptions as ActivityRecordBacking).read === 'function'
      && typeof (backingOrOptions as ActivityRecordBacking).write === 'function'
      ;
    const config: ActivityRepositoryCoreOptions = isBacking ? options : backingOrOptions as ActivityRepositoryCoreOptions;
    this.backing = isBacking
      ? backingOrOptions as ActivityRecordBacking
      : config.backing ?? {
        read: config.read ?? (() => Promise.reject(new Error('Activity backing read is not configured'))),
        write: config.write ?? (() => Promise.reject(new Error('Activity backing write is not configured'))),
      };
    this.clock = config.clock ?? (() => new Date());
    this.idGenerator = config.idGenerator ?? config.id ?? ((prefix = 'activity') => {
      fallbackIdCounter += 1;
      return `${prefix}_${Date.now().toString(36)}_${fallbackIdCounter}`;
    });
  }

  private serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private nowTimestamp(): string {
    const value = this.clock();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    return value;
  }

  private async readRecords(): Promise<PersistedActivity[]> {
    const raw = await this.backing.read();
    const records = Array.isArray(raw) ? raw.map(cloneActivity) : [];
    const migrated = records.filter((activity) => !OLD_SEED_IDS.has(activity.id));
    if (migrated.length !== records.length) await this.backing.write(migrated.map(cloneActivity));
    return migrated;
  }

  private async writeRecords(records: PersistedActivity[]): Promise<void> {
    await this.backing.write(records.map(cloneActivity));
  }

  private applySnapshot(activity: PersistedActivity, snapshot: ActivityTrackingSnapshot): PersistedActivity {
    return {
      ...activity,
      distanceMeters: snapshot.distanceMeters,
      elevationGainMeters: snapshot.elevationGainMeters,
      route: snapshot.route ? snapshot.route.map(clonePoint) : null,
      gpsUnavailableReason: snapshot.gpsUnavailableReason,
      movingDuration: snapshot.movingDuration,
      metHours: snapshot.metHours,
    };
  }

  private snapshotCheckpointTimestamp(): string {
    return this.nowTimestamp();
  }

  private activityAtCheckpoint(activity: PersistedActivity, timestamp: string): PersistedActivity {
    return {
      ...activity,
      activeDuration: calculateActiveDurationMs(activity.startTimestamp, timestamp, positiveOrZero(activity.pauseDuration)),
      lastCheckpointTimestamp: timestamp,
    };
  }

  async getActiveActivity(userId: string): Promise<Activity | null> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const index = records.findIndex((activity) => activity.userId === userId && (activity.status === 'active' || activity.status === 'paused'));
      if (index < 0) return null;

      const activity = records[index];
      // An active record not created/continued by this JS process survived a
      // restart. Stop its clock at its last live checkpoint rather than
      // charging the time for which the app was not running.
      if (activity.status === 'active' && !this.liveIds.has(activity.id)) {
        const checkpoint = activity.lastCheckpointTimestamp
          ?? activity.route?.[activity.route.length - 1]?.timestamp
          ?? activity.startTimestamp;
        records[index] = {
          ...this.activityAtCheckpoint(activity, checkpoint),
          status: 'paused',
          pauseStartedTimestamp: checkpoint,
        };
        await this.writeRecords(records);
      }
      return cloneActivity(records[index]);
    });
  }

  async getHistory(userId: string): Promise<Activity[]> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      return records
        .filter((activity) => activity.userId === userId && activity.status === 'completed')
        .sort((a, b) => (finiteTimestamp(b.startTimestamp) ?? 0) - (finiteTimestamp(a.startTimestamp) ?? 0))
        .map(cloneActivity);
    });
  }

  async startActivity(
    userId: string,
    type: ActivityType,
    gpsAvailable: boolean,
    options?: { startedAt?: string; weightKg?: number | null },
  ): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const startedAt = options?.startedAt ?? this.nowTimestamp();
      const activity: PersistedActivity = {
        id: this.idGenerator('activity'),
        userId,
        type,
        startTimestamp: startedAt,
        endTimestamp: null,
        activeDuration: 0,
        pauseDuration: 0,
        pauseStartedTimestamp: null,
        distanceMeters: null,
        pace: null,
        speed: null,
        calories: null,
        calorieSource: null,
        elevationGainMeters: null,
        route: null,
        gpsAvailable,
        gpsUnavailableReason: null,
        source: 'tracked',
        status: 'active',
        createdAt: this.nowTimestamp(),
        trackingWeightKg: options?.weightKg ?? null,
        lastCheckpointTimestamp: startedAt,
      };
      records.unshift(activity);
      await this.writeRecords(records);
      this.liveIds.add(activity.id);
      return cloneActivity(activity);
    });
  }

  async pauseActivity(id: string, options?: { pausedAt?: string; snapshot?: ActivityTrackingSnapshot }): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const index = records.findIndex((activity) => activity.id === id);
      if (index < 0) throw new Error('Activity not found');
      const current = records[index];
      if (current.status !== 'active') return cloneActivity(current);

      const pausedAt = options?.pausedAt ?? this.nowTimestamp();
      let updated = this.activityAtCheckpoint(current, pausedAt);
      if (options?.snapshot) updated = this.applySnapshot(updated, options.snapshot);
      updated = { ...updated, status: 'paused', pauseStartedTimestamp: pausedAt };
      records[index] = updated;
      await this.writeRecords(records);
      return cloneActivity(updated);
    });
  }

  async resumeActivity(id: string): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const index = records.findIndex((activity) => activity.id === id);
      if (index < 0) throw new Error('Activity not found');
      const current = records[index];
      if (current.status !== 'paused') return cloneActivity(current);

      const resumedAt = this.nowTimestamp();
      const pauseStarted = finiteTimestamp(current.pauseStartedTimestamp);
      const addedPause = pauseStarted == null ? 0 : Math.max(0, (finiteTimestamp(resumedAt) ?? pauseStarted) - pauseStarted);
      const updated: PersistedActivity = {
        ...current,
        status: 'active',
        pauseDuration: positiveOrZero(current.pauseDuration) + addedPause,
        pauseStartedTimestamp: null,
        lastCheckpointTimestamp: resumedAt,
      };
      records[index] = updated;
      await this.writeRecords(records);
      this.liveIds.add(id);
      return cloneActivity(updated);
    });
  }

  async updateTrackingSnapshot(id: string, snapshot: ActivityTrackingSnapshot): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const index = records.findIndex((activity) => activity.id === id);
      if (index < 0) throw new Error('Activity not found');
      const current = records[index];
      // A checkpoint that arrives after end/cancel must never resurrect or
      // otherwise rewrite a finalized record.
      if (current.status === 'completed' || current.status === 'cancelled') return cloneActivity(current);

      const checkpoint = this.snapshotCheckpointTimestamp();
      let updated = this.applySnapshot(current, snapshot);
      if (current.status === 'active') updated = this.activityAtCheckpoint(updated, checkpoint);
      else updated = { ...updated, lastCheckpointTimestamp: checkpoint };
      records[index] = updated;
      await this.writeRecords(records);
      return cloneActivity(updated);
    });
  }

  async endActivity(
    id: string,
    input: { weightKg?: number | null; gps?: EndActivityGpsSnapshot; endedAt?: string },
  ): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const index = records.findIndex((activity) => activity.id === id);
      if (index < 0) throw new Error('Activity not found');
      const current = records[index];
      if (current.status === 'completed' || current.status === 'cancelled') return cloneActivity(current);

      const endedAt = input.endedAt ?? this.nowTimestamp();
      const endedAtMs = finiteTimestamp(endedAt);
      const openPauseStart = current.status === 'paused' ? finiteTimestamp(current.pauseStartedTimestamp) : null;
      const openPause = openPauseStart == null || endedAtMs == null ? 0 : Math.max(0, endedAtMs - openPauseStart);
      const pauseDuration = positiveOrZero(current.pauseDuration) + openPause;
      const activeDuration = calculateActiveDurationMs(current.startTimestamp, endedAt, pauseDuration);

      let finalized = input.gps ? this.applySnapshot(current, input.gps) : current;
      const movingDuration = finalized.movingDuration;
      const metricDuration = current.source === 'manual' ? activeDuration : movingDuration ?? activeDuration;
      const distance = finalized.distanceMeters;
      const speed = distance == null ? null : calculateSpeed(distance, metricDuration);
      const pace = distance == null ? null : calculatePace(distance, metricDuration);
      const weight = hasOwn(input, 'weightKg') && input.weightKg !== undefined
        ? input.weightKg
        : finalized.trackingWeightKg ?? null;

      let calories: number | null;
      if (finalized.gpsAvailable && finalized.source !== 'manual') {
        calories = finalized.route && finalized.route.length > 0 && typeof finalized.metHours === 'number' && Number.isFinite(finalized.metHours)
          ? caloriesFromMetHours(finalized.metHours, weight)
          : null;
      } else {
        calories = estimateActivityCalories(finalized.type, activeDuration, weight);
      }

      finalized = {
        ...finalized,
        status: 'completed',
        endTimestamp: endedAt,
        activeDuration,
        pauseDuration,
        pauseStartedTimestamp: null,
        movingDuration: finalized.movingDuration,
        calories,
        calorieSource: 'calculated',
        distanceMeters: distance,
        pace,
        speed,
        lastCheckpointTimestamp: endedAt,
      };
      records[index] = finalized;
      await this.writeRecords(records);
      this.liveIds.delete(id);
      return cloneActivity(finalized);
    });
  }

  async logManualActivity(input: Omit<Activity, 'id' | 'createdAt' | 'status'>): Promise<Activity> {
    return this.serialized(async () => {
      const records = await this.readRecords();
      const activity: PersistedActivity = {
        ...input,
        id: this.idGenerator('activity'),
        createdAt: this.nowTimestamp(),
        status: 'completed',
        source: 'manual',
        route: null,
        gpsAvailable: false,
        gpsUnavailableReason: null,
        pauseStartedTimestamp: null,
      };
      records.unshift(activity);
      await this.writeRecords(records);
      return cloneActivity(activity);
    });
  }
}
