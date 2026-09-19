import {
  initialize,
  getSdkStatus,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  aggregateRecord,
  openHealthConnectSettings,
  SdkAvailabilityStatus,
  DeviceType,
  RecordingMethod,
  SleepStageType,
} from 'react-native-health-connect';
import type { Metadata, Permission, RecordType } from 'react-native-health-connect';

/** Mirrors the package's internal (non-exported) TimeRangeFilter shape from types/base.types.d.ts. */
export type TimeRangeFilter = { operator: 'between'; startTime: string; endTime: string } | { operator: 'after'; startTime: string } | { operator: 'before'; endTime: string };
import {
  HealthConnectField,
  HealthConnectSource,
  HealthConnectMetrics,
  HealthConnectDebugInfo,
  HealthConnectDebugRecord,
  SleepSummary,
  createEmptyHealthConnectMetrics,
  createEmptyDebugInfo,
  unavailableHcField,
} from './models';

/**
 * Every permission this app actually requests — read-only, matching exactly
 * the metrics section 2 of the spec asks for. Never write access: LongLivy
 * only reads what NoiseFit/Google Fit already wrote via the verified
 * pipeline, never inserts anything of its own into Health Connect.
 */
export const REQUIRED_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'RespiratoryRate' },
  { accessType: 'read', recordType: 'BodyTemperature' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Height' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'Hydration' },
];

const DEVICE_TYPE_LABELS: Record<number, string> = {
  [DeviceType.TYPE_UNKNOWN]: 'Unknown',
  [DeviceType.TYPE_PHONE]: 'Phone',
  [DeviceType.TYPE_SCALE]: 'Scale',
  [DeviceType.TYPE_RING]: 'Ring',
  [DeviceType.TYPE_HEAD_MOUNTED]: 'Head-mounted',
  [DeviceType.TYPE_FITNESS_BAND]: 'Fitness Band',
  [DeviceType.TYPE_CHEST_STRAP]: 'Chest Strap',
  [DeviceType.TYPE_SMART_DISPLAY]: 'Smart Display',
};

const RECORDING_METHOD_LABELS: Record<number, string> = {
  [RecordingMethod.RECORDING_METHOD_UNKNOWN]: 'Unknown',
  [RecordingMethod.RECORDING_METHOD_ACTIVELY_RECORDED]: 'Actively recorded',
  [RecordingMethod.RECORDING_METHOD_AUTOMATICALLY_RECORDED]: 'Automatically recorded',
  [RecordingMethod.RECORDING_METHOD_MANUAL_ENTRY]: 'Manual entry',
};

const SLEEP_STAGE_LABELS: Record<number, string> = {
  [SleepStageType.UNKNOWN]: 'Unknown',
  [SleepStageType.AWAKE]: 'Awake',
  [SleepStageType.SLEEPING]: 'Sleeping',
  [SleepStageType.OUT_OF_BED]: 'Out of bed',
  [SleepStageType.LIGHT]: 'Light',
  [SleepStageType.DEEP]: 'Deep',
  [SleepStageType.REM]: 'REM',
};

/** Local midnight -> now. Built from local Date components, not a UTC truncation, so "today" matches the phone's actual calendar day. */
export function todayRange(): TimeRangeFilter {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return { operator: 'between', startTime: start.toISOString(), endTime: now.toISOString() };
}

export function recentWindow(days: number): TimeRangeFilter {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { operator: 'between', startTime: start.toISOString(), endTime: now.toISOString() };
}

/** Reads Health Connect's own record metadata — never hardcodes an app name. Returns 'unknown' only when Health Connect itself didn't supply attribution. */
export function describeSource(metadata: Metadata | undefined): HealthConnectSource | 'unknown' {
  if (!metadata || !metadata.dataOrigin) return 'unknown';
  return {
    packageName: metadata.dataOrigin,
    deviceManufacturer: metadata.device?.manufacturer ?? null,
    deviceModel: metadata.device?.model ?? null,
    deviceType: metadata.device?.type !== undefined ? (DEVICE_TYPE_LABELS[metadata.device.type] ?? null) : null,
    recordingMethod: metadata.recordingMethod !== undefined ? (RECORDING_METHOD_LABELS[metadata.recordingMethod] ?? null) : null,
  };
}

export async function checkAvailability(): Promise<'available' | 'unavailable' | 'update_required'> {
  const status = await getSdkStatus();
  if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
  if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'update_required';
  return 'unavailable';
}

export async function ensureInitialized(): Promise<boolean> {
  return initialize();
}

export async function getCurrentPermissions(): Promise<Permission[]> {
  const granted = await getGrantedPermissions();
  return granted.filter((p): p is Permission => 'recordType' in p && 'accessType' in p);
}

export async function hasAllRequiredPermissions(): Promise<boolean> {
  const granted = await getCurrentPermissions();
  const grantedKeys = new Set(granted.map((p) => `${p.accessType}:${p.recordType}`));
  return REQUIRED_PERMISSIONS.every((p) => grantedKeys.has(`${p.accessType}:${p.recordType}`));
}

export async function requestAllPermissions(): Promise<Permission[]> {
  const result = await requestPermission(REQUIRED_PERMISSIONS);
  return result.filter((p): p is Permission => 'recordType' in p && 'accessType' in p);
}

export function openSettings(): void {
  openHealthConnectSettings();
}

/** Latest single-value instantaneous record (RestingHeartRate, HRV, SpO2, RespiratoryRate, BodyTemperature, Height, Weight all share this shape). */
async function fetchLatestValue(recordType: RecordType, windowDays: number, extract: (record: any) => number | null): Promise<HealthConnectField<number>> {
  try {
    const { records } = await readRecords(recordType, { timeRangeFilter: recentWindow(windowDays) });
    if (records.length === 0) return unavailableHcField();
    const sorted = [...records].sort((a: any, b: any) => new Date(b.time ?? b.startTime).getTime() - new Date(a.time ?? a.startTime).getTime());
    const latest: any = sorted[0];
    const value = extract(latest);
    if (value === null || value === undefined) return unavailableHcField();
    return {
      status: value === 0 ? 'available_zero' : 'available',
      value,
      source: describeSource(latest.metadata),
      recordedAt: latest.time ?? latest.startTime ?? null,
      recordCount: records.length,
    };
  } catch {
    return unavailableHcField();
  }
}

async function fetchAggregateTotal<T extends 'Steps' | 'Distance' | 'ActiveCaloriesBurned' | 'TotalCaloriesBurned' | 'Hydration'>(
  recordType: T,
  extract: (result: any) => number | null
): Promise<HealthConnectField<number>> {
  try {
    const range = todayRange();
    const result = await aggregateRecord({ recordType, timeRangeFilter: range } as any);
    const value = extract(result);
    const dataOrigins = (result as any).dataOrigins as string[] | undefined;
    if (value === null || value === undefined || !dataOrigins || dataOrigins.length === 0) return unavailableHcField();
    return {
      status: value === 0 ? 'available_zero' : 'available',
      value,
      source: { packageName: dataOrigins.join(', '), deviceManufacturer: null, deviceModel: null, deviceType: null, recordingMethod: null },
      recordedAt: range.operator === 'between' ? range.endTime : null,
      recordCount: 0,
    };
  } catch {
    return unavailableHcField();
  }
}

/** Heart Rate is special: each record carries a `samples[]` array, not a single value — flatten across records and take the most recent sample, per spec section 9. */
async function fetchLatestHeartRate(): Promise<HealthConnectField<number>> {
  try {
    const { records } = await readRecords('HeartRate', { timeRangeFilter: recentWindow(2) });
    if (records.length === 0) return unavailableHcField();
    let bestSample: { time: string; beatsPerMinute: number } | null = null;
    let bestMetadata: Metadata | undefined;
    let totalSamples = 0;
    for (const record of records) {
      for (const sample of record.samples) {
        totalSamples += 1;
        if (!bestSample || new Date(sample.time).getTime() > new Date(bestSample.time).getTime()) {
          bestSample = sample;
          bestMetadata = record.metadata;
        }
      }
    }
    if (!bestSample) return unavailableHcField();
    return {
      status: bestSample.beatsPerMinute === 0 ? 'available_zero' : 'available',
      value: bestSample.beatsPerMinute,
      source: describeSource(bestMetadata),
      recordedAt: bestSample.time,
      recordCount: totalSamples,
    };
  } catch {
    return unavailableHcField();
  }
}

async function fetchExerciseSessionCount(): Promise<HealthConnectField<number>> {
  try {
    const { records } = await readRecords('ExerciseSession', { timeRangeFilter: todayRange() });
    return {
      status: records.length === 0 ? 'available_zero' : 'available',
      value: records.length,
      source: records.length > 0 ? describeSource(records[records.length - 1].metadata) : null,
      recordedAt: records.length > 0 ? records[records.length - 1].startTime : null,
      recordCount: records.length,
    };
  } catch {
    return unavailableHcField();
  }
}

async function fetchLatestSleepSession(): Promise<HealthConnectField<SleepSummary>> {
  try {
    const { records } = await readRecords('SleepSession', { timeRangeFilter: recentWindow(2) });
    if (records.length === 0) return unavailableHcField();
    const sorted = [...records].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    const latest = sorted[0];
    const totalMinutes = (new Date(latest.endTime).getTime() - new Date(latest.startTime).getTime()) / 60000;
    const stageTotals = new Map<string, number>();
    for (const stage of latest.stages ?? []) {
      const label = SLEEP_STAGE_LABELS[stage.stage] ?? 'Unknown';
      const minutes = (new Date(stage.endTime).getTime() - new Date(stage.startTime).getTime()) / 60000;
      stageTotals.set(label, (stageTotals.get(label) ?? 0) + minutes);
    }
    const summary: SleepSummary = {
      totalMinutes,
      startTime: latest.startTime,
      endTime: latest.endTime,
      stages: Array.from(stageTotals.entries()).map(([stage, minutes]) => ({ stage, minutes: Math.round(minutes) })),
    };
    return {
      status: 'available',
      value: summary,
      source: describeSource(latest.metadata),
      recordedAt: latest.endTime,
      recordCount: records.length,
    };
  } catch {
    return unavailableHcField();
  }
}

export async function fetchAllMetrics(): Promise<HealthConnectMetrics> {
  const [
    steps,
    distanceKm,
    totalCaloriesKcal,
    activeCaloriesKcal,
    exerciseSessionCount,
    heartRateBpm,
    restingHeartRateBpm,
    heartRateVariabilityMillis,
    spo2Percent,
    respiratoryRate,
    bodyTemperatureCelsius,
    sleep,
    heightCm,
    weightKg,
    hydrationLiters,
  ] = await Promise.all([
    fetchAggregateTotal('Steps', (r) => r.COUNT_TOTAL ?? null),
    fetchAggregateTotal('Distance', (r) => r.DISTANCE?.inKilometers ?? null),
    fetchAggregateTotal('TotalCaloriesBurned', (r) => r.ENERGY_TOTAL?.inKilocalories ?? null),
    fetchAggregateTotal('ActiveCaloriesBurned', (r) => r.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? null),
    fetchExerciseSessionCount(),
    fetchLatestHeartRate(),
    fetchLatestValue('RestingHeartRate', 7, (r) => r.beatsPerMinute ?? null),
    fetchLatestValue('HeartRateVariabilityRmssd', 7, (r) => r.heartRateVariabilityMillis ?? null),
    fetchLatestValue('OxygenSaturation', 2, (r) => r.percentage ?? null),
    fetchLatestValue('RespiratoryRate', 7, (r) => r.rate ?? null),
    fetchLatestValue('BodyTemperature', 7, (r) => r.temperature?.inCelsius ?? null),
    fetchLatestSleepSession(),
    fetchLatestValue('Height', 365, (r) => r.height?.inCentimeters ?? (r.height?.inMeters ? r.height.inMeters * 100 : null)),
    fetchLatestValue('Weight', 365, (r) => r.weight?.inKilograms ?? null),
    fetchAggregateTotal('Hydration', (r) => r.VOLUME_TOTAL?.inLiters ?? null),
  ]);

  return {
    steps,
    distanceKm,
    totalCaloriesKcal,
    activeCaloriesKcal,
    exerciseSessionCount,
    heartRateBpm,
    restingHeartRateBpm,
    heartRateVariabilityMillis,
    spo2Percent,
    respiratoryRate,
    bodyTemperatureCelsius,
    sleep,
    heightCm,
    weightKg,
    hydrationLiters,
  };
}

const DEBUG_RECORD_TYPES: RecordType[] = [
  'Steps',
  'Distance',
  'ActiveCaloriesBurned',
  'TotalCaloriesBurned',
  'ExerciseSession',
  'HeartRate',
  'RestingHeartRate',
  'HeartRateVariabilityRmssd',
  'OxygenSaturation',
  'RespiratoryRate',
  'BodyTemperature',
  'SleepSession',
  'Height',
  'Weight',
  'Hydration',
];

function summarizeRecord(recordType: string, record: any): string {
  switch (recordType) {
    case 'Steps':
      return `${record.count} steps`;
    case 'Distance':
      return `${record.distance?.inKilometers?.toFixed(2)} km`;
    case 'ActiveCaloriesBurned':
    case 'TotalCaloriesBurned':
      return `${record.energy?.inKilocalories?.toFixed(0)} kcal`;
    case 'HeartRate':
      return `${record.samples?.length ?? 0} sample(s)`;
    case 'RestingHeartRate':
      return `${record.beatsPerMinute} BPM`;
    case 'HeartRateVariabilityRmssd':
      return `${record.heartRateVariabilityMillis} ms`;
    case 'OxygenSaturation':
      return `${record.percentage}%`;
    case 'RespiratoryRate':
      return `${record.rate} breaths/min`;
    case 'BodyTemperature':
      return `${record.temperature?.inCelsius?.toFixed(1)}°C`;
    case 'SleepSession':
      return `${((new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 60000).toFixed(0)} min`;
    case 'Height':
      return `${record.height?.inCentimeters?.toFixed(1) ?? ((record.height?.inMeters ?? 0) * 100).toFixed(1)} cm`;
    case 'Weight':
      return `${record.weight?.inKilograms?.toFixed(1)} kg`;
    case 'Hydration':
      return `${record.volume?.inLiters?.toFixed(2)} L`;
    case 'ExerciseSession':
      return `exercise type ${record.exerciseType ?? 'unknown'}`;
    default:
      return 'record';
  }
}

/** Powers the Developer -> Health Connect Debug section: per-type record counts and a handful of recent raw records with full source metadata. */
export async function fetchDebugInfo(): Promise<HealthConnectDebugInfo> {
  const info = createEmptyDebugInfo();
  await Promise.all(
    DEBUG_RECORD_TYPES.map(async (recordType) => {
      try {
        const { records } = await readRecords(recordType, { timeRangeFilter: recentWindow(7) });
        info.recordCounts[recordType] = records.length;
        info.recentRecords[recordType] = records
          .slice(-5)
          .reverse()
          .map(
            (record: any): HealthConnectDebugRecord => ({
              recordType,
              summary: summarizeRecord(recordType, record),
              startTime: record.startTime ?? record.time ?? null,
              endTime: record.endTime ?? record.time ?? null,
              source: describeSource(record.metadata),
            })
          );
      } catch {
        info.recordCounts[recordType] = 0;
        info.recentRecords[recordType] = [];
      }
    })
  );
  return info;
}
