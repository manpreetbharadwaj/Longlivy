/**
 * iOS counterpart to src/features/healthConnect — reads real data from
 * Apple Health via HealthKit. Deliberately independent of the Android
 * Health Connect feature (no shared imports) but structurally identical
 * field/source shapes, so the same field-row UI works for both platforms
 * via TypeScript structural typing (see NoiseDeviceScreen.tsx's
 * `HealthFieldRow`). This feature never talks to the Noise watch or any
 * BLE code — it only reads what Apple Health already has.
 */

export type HealthKitStatus = 'checking' | 'unavailable' | 'permission_required' | 'ready' | 'error';

/**
 * Where a sample actually came from, read directly from HealthKit's own
 * `sourceRevision`/`device` metadata — never hardcoded. HealthKit reports
 * "Apple Watch" only when the recording device genuinely was one; a sample
 * written by the Health app itself or a third-party app reports that
 * app's name instead.
 */
export interface HealthKitSource {
  /** The app that wrote this sample, e.g. "Health" — HealthKit's own attribution. */
  name: string;
  bundleIdentifier: string;
  deviceName: string | null;
  deviceManufacturer: string | null;
  deviceModel: string | null;
}

export type HealthKitFieldStatus = 'available' | 'available_zero' | 'not_available' | 'permission_required';

/**
 * Same shape as HealthConnectField<T> in the Android feature, kept as an
 * independent declaration rather than a shared import — both features
 * stay decoupled while the UI still treats them identically.
 */
export interface HealthKitField<T> {
  status: HealthKitFieldStatus;
  value: T | null;
  /** null = not applicable; 'unknown' = a sample exists but source metadata was empty; object = known source. */
  source: HealthKitSource | 'unknown' | null;
  /** ISO timestamp of the sample itself (its endDate, or time for instantaneous samples) — not when we fetched it. */
  recordedAt: string | null;
  /** How many raw HealthKit samples contributed to this value. */
  recordCount: number;
}

export function unavailableHkField<T>(): HealthKitField<T> {
  return { status: 'not_available', value: null, source: null, recordedAt: null, recordCount: 0 };
}

export interface SleepStageSummary {
  /** Human label from HealthKit's CategoryValueSleepAnalysis enum: Awake, Core, Deep, REM. */
  stage: string;
  minutes: number;
}

export interface SleepSummary {
  totalMinutes: number;
  startTime: string;
  endTime: string;
  stages: SleepStageSummary[];
}

export interface HealthKitMetrics {
  steps: HealthKitField<number>;
  distanceKm: HealthKitField<number>;
  activeCaloriesKcal: HealthKitField<number>;
  exerciseMinutes: HealthKitField<number>;
  heartRateBpm: HealthKitField<number>;
  restingHeartRateBpm: HealthKitField<number>;
  heartRateVariabilityMillis: HealthKitField<number>;
  spo2Percent: HealthKitField<number>;
  respiratoryRate: HealthKitField<number>;
  bodyTemperatureCelsius: HealthKitField<number>;
  sleep: HealthKitField<SleepSummary>;
  heightCm: HealthKitField<number>;
  weightKg: HealthKitField<number>;
}

export function createEmptyHealthKitMetrics(): HealthKitMetrics {
  return {
    steps: unavailableHkField(),
    distanceKm: unavailableHkField(),
    activeCaloriesKcal: unavailableHkField(),
    exerciseMinutes: unavailableHkField(),
    heartRateBpm: unavailableHkField(),
    restingHeartRateBpm: unavailableHkField(),
    heartRateVariabilityMillis: unavailableHkField(),
    spo2Percent: unavailableHkField(),
    respiratoryRate: unavailableHkField(),
    bodyTemperatureCelsius: unavailableHkField(),
    sleep: unavailableHkField(),
    heightCm: unavailableHkField(),
    weightKg: unavailableHkField(),
  };
}

/** Every key of HealthKitMetrics — single source of truth for diffing/iterating, mirrors HC_METRIC_FIELD_KEYS. */
export const HK_METRIC_FIELD_KEYS: (keyof HealthKitMetrics)[] = [
  'steps',
  'distanceKm',
  'activeCaloriesKcal',
  'exerciseMinutes',
  'heartRateBpm',
  'restingHeartRateBpm',
  'heartRateVariabilityMillis',
  'spo2Percent',
  'respiratoryRate',
  'bodyTemperatureCelsius',
  'sleep',
  'heightCm',
  'weightKg',
];

export function latestRecordedAt(metrics: HealthKitMetrics): string | null {
  let latest: string | null = null;
  for (const key of HK_METRIC_FIELD_KEYS) {
    const recordedAt = metrics[key].recordedAt;
    if (recordedAt && (!latest || new Date(recordedAt).getTime() > new Date(latest).getTime())) latest = recordedAt;
  }
  return latest;
}

/** Field keys whose recordedAt advanced since the previous refresh — basis for "New data received". */
export function diffNewDataFields(previous: HealthKitMetrics | null, next: HealthKitMetrics): (keyof HealthKitMetrics)[] {
  if (!previous) return [];
  const result: (keyof HealthKitMetrics)[] = [];
  for (const key of HK_METRIC_FIELD_KEYS) {
    const prevAt = previous[key].recordedAt;
    const nextAt = next[key].recordedAt;
    if (!nextAt) continue;
    if (!prevAt || new Date(nextAt).getTime() > new Date(prevAt).getTime()) result.push(key);
  }
  return result;
}

/** One raw sample kept for the Apple Health Debug section. */
export interface HealthKitDebugRecord {
  identifier: string;
  summary: string;
  startTime: string | null;
  endTime: string | null;
  source: HealthKitSource | 'unknown';
}

export interface HealthKitDebugInfo {
  recordCounts: Record<string, number>;
  recentRecords: Record<string, HealthKitDebugRecord[]>;
}

export function createEmptyHealthKitDebugInfo(): HealthKitDebugInfo {
  return { recordCounts: {}, recentRecords: {} };
}

/** identifier -> human label, for the Apple Health Debug per-metric authorization checklist and Activity/Vitals/Sleep/Body grouping in the UI. */
export const REQUIRED_HK_METRIC_LABELS: [string, string][] = [
  ['HKQuantityTypeIdentifierStepCount', 'Steps'],
  ['HKQuantityTypeIdentifierDistanceWalkingRunning', 'Distance'],
  ['HKQuantityTypeIdentifierActiveEnergyBurned', 'Active Calories'],
  ['HKQuantityTypeIdentifierAppleExerciseTime', 'Exercise'],
  ['HKQuantityTypeIdentifierHeartRate', 'Heart Rate'],
  ['HKQuantityTypeIdentifierRestingHeartRate', 'Resting Heart Rate'],
  ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'Heart Rate Variability'],
  ['HKQuantityTypeIdentifierOxygenSaturation', 'Oxygen Saturation (SpO2)'],
  ['HKQuantityTypeIdentifierRespiratoryRate', 'Respiratory Rate'],
  ['HKQuantityTypeIdentifierBodyTemperature', 'Body Temperature'],
  ['HKCategoryTypeIdentifierSleepAnalysis', 'Sleep'],
  ['HKQuantityTypeIdentifierHeight', 'Height'],
  ['HKQuantityTypeIdentifierBodyMass', 'Weight'],
];
