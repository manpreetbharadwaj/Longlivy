/**
 * Health Connect is the verified real-data path for watch metrics (see
 * conversation: NoiseFit -> Google Fit -> Health Connect, confirmed with a
 * real 85 BPM NoiseFit-originated record). This feature never talks to the
 * Noise watch directly — it only reads what Android's Health Connect
 * platform already has, via the documented `react-native-health-connect`
 * client. The BLE feature (src/features/noise/) is untouched and still owns
 * the actual device connection, battery, and diagnostics.
 */

/** Whole-feature status — distinct from per-field status below. */
export type HealthConnectStatus = 'checking' | 'unavailable' | 'update_required' | 'permission_required' | 'ready' | 'error';

/**
 * Where a record actually came from, read directly from Health Connect's
 * own record metadata (`dataOrigin`, `device`) — never hardcoded. This is
 * what lets the UI say "NoiseFit" instead of silently assuming it.
 */
export interface HealthConnectSource {
  /** The Android package that wrote this record, e.g. "com.noisefit" — Health Connect's own attribution, not a guess. */
  packageName: string;
  deviceManufacturer: string | null;
  deviceModel: string | null;
  /** Human label derived from Health Connect's DeviceType enum, e.g. "Fitness Band", "Phone". */
  deviceType: string | null;
  /** Human label derived from Health Connect's RecordingMethod enum, e.g. "Actively recorded", "Automatically recorded". */
  recordingMethod: string | null;
}

export type HealthConnectFieldStatus = 'available' | 'available_zero' | 'not_available' | 'permission_required';

/**
 * One metric's current value as read from Health Connect. `source` is
 * deliberately separate from `status`: a field can be `available` with
 * `source: 'unknown'` if Health Connect returned a record whose metadata
 * couldn't be parsed — that must render as "Source Unknown", never silently
 * treated as verified or hidden.
 */
export interface HealthConnectField<T> {
  status: HealthConnectFieldStatus;
  value: T | null;
  /** null = not applicable (field not available); 'unknown' = data exists but source metadata was empty/unparseable; object = known source. */
  source: HealthConnectSource | 'unknown' | null;
  /** ISO timestamp of the record itself (its `time` or `startTime`) — not when we fetched it. */
  recordedAt: string | null;
  /** How many raw Health Connect records contributed to this value — for debug/transparency, e.g. an aggregate built from 12 Steps records. */
  recordCount: number;
}

export function unavailableHcField<T>(): HealthConnectField<T> {
  return { status: 'not_available', value: null, source: null, recordedAt: null, recordCount: 0 };
}

export function permissionRequiredHcField<T>(): HealthConnectField<T> {
  return { status: 'permission_required', value: null, source: null, recordedAt: null, recordCount: 0 };
}

export interface SleepStageSummary {
  /** Human label from Health Connect's SleepStageType enum: Awake, Light, Deep, REM, etc. */
  stage: string;
  minutes: number;
}

export interface SleepSummary {
  totalMinutes: number;
  startTime: string;
  endTime: string;
  stages: SleepStageSummary[];
}

export interface HealthConnectMetrics {
  steps: HealthConnectField<number>;
  distanceKm: HealthConnectField<number>;
  totalCaloriesKcal: HealthConnectField<number>;
  activeCaloriesKcal: HealthConnectField<number>;
  exerciseSessionCount: HealthConnectField<number>;
  heartRateBpm: HealthConnectField<number>;
  restingHeartRateBpm: HealthConnectField<number>;
  heartRateVariabilityMillis: HealthConnectField<number>;
  spo2Percent: HealthConnectField<number>;
  respiratoryRate: HealthConnectField<number>;
  bodyTemperatureCelsius: HealthConnectField<number>;
  sleep: HealthConnectField<SleepSummary>;
  heightCm: HealthConnectField<number>;
  weightKg: HealthConnectField<number>;
  hydrationLiters: HealthConnectField<number>;
}

export function createEmptyHealthConnectMetrics(): HealthConnectMetrics {
  return {
    steps: unavailableHcField(),
    distanceKm: unavailableHcField(),
    totalCaloriesKcal: unavailableHcField(),
    activeCaloriesKcal: unavailableHcField(),
    exerciseSessionCount: unavailableHcField(),
    heartRateBpm: unavailableHcField(),
    restingHeartRateBpm: unavailableHcField(),
    heartRateVariabilityMillis: unavailableHcField(),
    spo2Percent: unavailableHcField(),
    respiratoryRate: unavailableHcField(),
    bodyTemperatureCelsius: unavailableHcField(),
    sleep: unavailableHcField(),
    heightCm: unavailableHcField(),
    weightKg: unavailableHcField(),
    hydrationLiters: unavailableHcField(),
  };
}

/** One raw record kept for the Health Connect Debug section — deliberately generic since record shapes vary a lot by type. */
export interface HealthConnectDebugRecord {
  recordType: string;
  summary: string;
  startTime: string | null;
  endTime: string | null;
  source: HealthConnectSource | 'unknown';
}

export interface HealthConnectDebugInfo {
  /** recordType -> how many records were found in the last query window. */
  recordCounts: Record<string, number>;
  /** recordType -> a handful of recent raw records for inspection. */
  recentRecords: Record<string, HealthConnectDebugRecord[]>;
}

export function createEmptyDebugInfo(): HealthConnectDebugInfo {
  return { recordCounts: {}, recentRecords: {} };
}

/** Every key of HealthConnectMetrics, in the order fields should be diffed/displayed. Kept as a single source of truth so the "new data received" comparison never silently misses a field added later. */
export const HC_METRIC_FIELD_KEYS: (keyof HealthConnectMetrics)[] = [
  'steps',
  'distanceKm',
  'totalCaloriesKcal',
  'activeCaloriesKcal',
  'exerciseSessionCount',
  'heartRateBpm',
  'restingHeartRateBpm',
  'heartRateVariabilityMillis',
  'spo2Percent',
  'respiratoryRate',
  'bodyTemperatureCelsius',
  'sleep',
  'heightCm',
  'weightKg',
  'hydrationLiters',
];

/** The most recent `recordedAt` across every populated field — "when did the freshest data we have actually come from", as opposed to lastCheckedAt (when we last asked Health Connect). */
export function latestRecordedAt(metrics: HealthConnectMetrics): string | null {
  let latest: string | null = null;
  for (const key of HC_METRIC_FIELD_KEYS) {
    const recordedAt = metrics[key].recordedAt;
    if (recordedAt && (!latest || new Date(recordedAt).getTime() > new Date(latest).getTime())) latest = recordedAt;
  }
  return latest;
}

/**
 * Field keys whose recordedAt actually advanced since the previous refresh
 * (or that went from unavailable to available) — the basis for "New data
 * received ✓". A field that simply stayed at the same recordedAt (Health
 * Connect returned the same record again) is never reported as new.
 */
export function diffNewDataFields(previous: HealthConnectMetrics | null, next: HealthConnectMetrics): (keyof HealthConnectMetrics)[] {
  if (!previous) return [];
  const result: (keyof HealthConnectMetrics)[] = [];
  for (const key of HC_METRIC_FIELD_KEYS) {
    const prevAt = previous[key].recordedAt;
    const nextAt = next[key].recordedAt;
    if (!nextAt) continue;
    if (!prevAt || new Date(nextAt).getTime() > new Date(prevAt).getTime()) result.push(key);
  }
  return result;
}

export interface PipelineSourceSummary {
  /** Latest record.endTime/startTime among debug records whose source package name contains "noisefit" — honest best-effort, built only from what fetchDebugInfo already pulled (last 7 days, up to 5 records/type), never guessed. */
  lastNoiseFitRecordAt: string | null;
  /** Same, for records whose source package name is Google Fit's (com.google.android.apps.fitness). */
  lastGoogleFitRecordAt: string | null;
}

const NOISEFIT_PACKAGE_HINT = 'noisefit';
const GOOGLE_FIT_PACKAGE_HINT = 'google.android.apps.fitness';

/** Powers the "Data Pipeline Status" debug view — reads what's actually in debugInfo's source metadata rather than assuming any layer is present. */
export function summarizePipelineSources(debugInfo: HealthConnectDebugInfo): PipelineSourceSummary {
  let lastNoiseFitRecordAt: string | null = null;
  let lastGoogleFitRecordAt: string | null = null;
  for (const records of Object.values(debugInfo.recentRecords)) {
    for (const record of records) {
      if (record.source === 'unknown') continue;
      const pkg = record.source.packageName.toLowerCase();
      const at = record.endTime ?? record.startTime;
      if (!at) continue;
      if (pkg.includes(NOISEFIT_PACKAGE_HINT) && (!lastNoiseFitRecordAt || new Date(at).getTime() > new Date(lastNoiseFitRecordAt).getTime())) {
        lastNoiseFitRecordAt = at;
      }
      if (pkg.includes(GOOGLE_FIT_PACKAGE_HINT) && (!lastGoogleFitRecordAt || new Date(at).getTime() > new Date(lastGoogleFitRecordAt).getTime())) {
        lastGoogleFitRecordAt = at;
      }
    }
  }
  return { lastNoiseFitRecordAt, lastGoogleFitRecordAt };
}

export interface FreshestRecordInfo {
  recordType: string;
  summary: string;
  time: string;
  source: HealthConnectSource | 'unknown';
}

/**
 * The single most recent record across everything fetchDebugInfo pulled
 * (last 7 days, up to 5 records/type), optionally restricted to a source
 * filter (e.g. "only Google Fit-attributed records"). Powers the
 * Google Fit / Health Connect Bridge diagnostic — every value shown there
 * is a real record's own summary text, not a synthesized one.
 */
export function findFreshestRecord(debugInfo: HealthConnectDebugInfo, sourceFilter?: (source: HealthConnectSource | 'unknown') => boolean): FreshestRecordInfo | null {
  let best: FreshestRecordInfo | null = null;
  for (const [recordType, records] of Object.entries(debugInfo.recentRecords)) {
    for (const record of records) {
      if (sourceFilter && !sourceFilter(record.source)) continue;
      const time = record.endTime ?? record.startTime;
      if (!time) continue;
      if (!best || new Date(time).getTime() > new Date(best.time).getTime()) {
        best = { recordType, summary: record.summary, time, source: record.source };
      }
    }
  }
  return best;
}

export function isGoogleFitSource(source: HealthConnectSource | 'unknown'): boolean {
  return source !== 'unknown' && source.packageName.toLowerCase().includes(GOOGLE_FIT_PACKAGE_HINT);
}

export type FitBridgeStatus = 'receiving' | 'delayed' | 'no_data' | 'unknown';

/**
 * Empirically calibrated, not guessed: on this device, fresh Fit-attributed
 * Heart Rate entries were observed roughly every 15-45 minutes (consistent
 * with Android's WorkManager periodic-work minimum interval of 15 minutes),
 * with occasional longer gaps. "Delayed" is not an error state — it is the
 * normal, expected behavior of this bridge; it only becomes worth
 * surfacing as an anomaly well past that window.
 */
export function computeFitBridgeStatus(lastGoogleFitRecordAt: string | null, nowMs: number): FitBridgeStatus {
  if (!lastGoogleFitRecordAt) return 'no_data';
  const ageMinutes = (nowMs - new Date(lastGoogleFitRecordAt).getTime()) / 60000;
  if (ageMinutes <= 20) return 'receiving';
  return 'delayed';
}

/** recordType -> human label, for the Health Connect Debug per-metric permission checklist. Order matches the Activity/Vitals/Body/Nutrition/Sleep grouping in the UI. */
export const REQUIRED_HC_METRIC_LABELS: [string, string][] = [
  ['Steps', 'Steps'],
  ['Distance', 'Distance'],
  ['TotalCaloriesBurned', 'Total Calories Burned'],
  ['ActiveCaloriesBurned', 'Active Calories Burned'],
  ['ExerciseSession', 'Exercise'],
  ['HeartRate', 'Heart Rate'],
  ['RestingHeartRate', 'Resting Heart Rate'],
  ['HeartRateVariabilityRmssd', 'Heart Rate Variability'],
  ['OxygenSaturation', 'Oxygen Saturation (SpO2)'],
  ['RespiratoryRate', 'Respiratory Rate'],
  ['BodyTemperature', 'Body Temperature'],
  ['SleepSession', 'Sleep'],
  ['Height', 'Height'],
  ['Weight', 'Weight'],
  ['Hydration', 'Hydration'],
];
