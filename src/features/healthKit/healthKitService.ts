import { Platform } from 'react-native';
import {
  isHealthDataAvailableAsync,
  requestAuthorization,
  getRequestStatusForAuthorization,
  authorizationStatusFor,
  queryQuantitySamples,
  queryStatisticsForQuantity,
  queryCategorySamples,
  AuthorizationRequestStatus,
  AuthorizationStatus,
  CategoryValueSleepAnalysis,
} from '@kingstinct/react-native-healthkit';
import type { ObjectTypeIdentifier, QuantityTypeIdentifier, SourceRevision, Device } from '@kingstinct/react-native-healthkit';
import { HealthKitField, HealthKitSource, HealthKitMetrics, HealthKitDebugInfo, HealthKitDebugRecord, SleepSummary, createEmptyHealthKitMetrics, createEmptyHealthKitDebugInfo, unavailableHkField } from './models';

/**
 * Every HealthKit type this app reads — read-only, matching exactly what
 * section 2 of the spec asks for. LongLivy never writes to Apple Health.
 */
export const REQUIRED_READ_TYPES: ObjectTypeIdentifier[] = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierDistanceWalkingRunning',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierAppleExerciseTime',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierOxygenSaturation',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierBodyTemperature',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierBodyMass',
];

const SLEEP_STAGE_LABELS: Record<number, string> = {
  [CategoryValueSleepAnalysis.inBed]: 'In Bed',
  [CategoryValueSleepAnalysis.awake]: 'Awake',
  [CategoryValueSleepAnalysis.asleepCore]: 'Core',
  [CategoryValueSleepAnalysis.asleepDeep]: 'Deep',
  [CategoryValueSleepAnalysis.asleepREM]: 'REM',
};

function isIOS(): boolean {
  return Platform.OS === 'ios';
}

function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function recentWindow(days: number): { startDate: Date; endDate: Date } {
  const now = new Date();
  return { startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000), endDate: now };
}

/** Reads HealthKit's own sourceRevision/device metadata — never hardcodes "Apple Watch". */
function describeSource(sourceRevision: SourceRevision | undefined, device: Device | undefined): HealthKitSource | 'unknown' {
  if (!sourceRevision || !sourceRevision.source) return 'unknown';
  return {
    name: sourceRevision.source.name,
    bundleIdentifier: sourceRevision.source.bundleIdentifier,
    deviceName: device?.name ?? null,
    deviceManufacturer: device?.manufacturer ?? null,
    deviceModel: device?.model ?? null,
  };
}

export async function checkAvailability(): Promise<'available' | 'unavailable'> {
  if (!isIOS()) return 'unavailable';
  const available = await isHealthDataAvailableAsync();
  return available ? 'available' : 'unavailable';
}

/**
 * HealthKit never tells a read-only app whether the user granted or denied
 * a permission (privacy-by-design) — this only tells us whether we've
 * already asked. That opacity is real platform behavior, not a bug here.
 */
export async function hasRequestedPermissions(): Promise<boolean> {
  if (!isIOS()) return false;
  const status = await getRequestStatusForAuthorization({ toRead: REQUIRED_READ_TYPES });
  return status === AuthorizationRequestStatus.unnecessary;
}

export async function requestAllPermissions(): Promise<boolean> {
  if (!isIOS()) return false;
  return requestAuthorization({ toRead: REQUIRED_READ_TYPES });
}

/** Per-type authorization status, straight from HealthKit — 'unknown' is the honest, expected answer for most read-only quantity/category types (see authorizationStatusFor's Apple docs: it reports sharing/write status, which HealthKit deliberately never exposes for read permission). */
export function getAuthorizationStatuses(): Record<string, 'authorized' | 'not_authorized' | 'unknown'> {
  const result: Record<string, 'authorized' | 'not_authorized' | 'unknown'> = {};
  if (!isIOS()) {
    for (const type of REQUIRED_READ_TYPES) result[type] = 'unknown';
    return result;
  }
  for (const type of REQUIRED_READ_TYPES) {
    const status = authorizationStatusFor(type);
    result[type] = status === AuthorizationStatus.sharingAuthorized ? 'authorized' : status === AuthorizationStatus.sharingDenied ? 'not_authorized' : 'unknown';
  }
  return result;
}

async function fetchAggregateQuantity(identifier: QuantityTypeIdentifier, unit: string): Promise<HealthKitField<number>> {
  try {
    const start = startOfTodayLocal();
    const now = new Date();
    const result = await queryStatisticsForQuantity(identifier, ['cumulativeSum'], { filter: { date: { startDate: start, endDate: now } }, unit: unit as never });
    if (!result.sumQuantity || result.sources.length === 0) return unavailableHkField();
    const value = result.sumQuantity.quantity;
    const firstSource = result.sources[0];
    return {
      status: value === 0 ? 'available_zero' : 'available',
      value,
      source: firstSource ? { name: firstSource.name, bundleIdentifier: firstSource.bundleIdentifier, deviceName: null, deviceManufacturer: null, deviceModel: null } : 'unknown',
      recordedAt: now.toISOString(),
      recordCount: 0,
    };
  } catch {
    return unavailableHkField();
  }
}

/** Latest single-value sample (RestingHR, HRV, SpO2, RespRate, BodyTemp, Height, Weight) — flattens and finds the true max startDate rather than trusting return order. */
async function fetchLatestValue(identifier: QuantityTypeIdentifier, unit: string, windowDays: number): Promise<HealthKitField<number>> {
  try {
    const { startDate, endDate } = recentWindow(windowDays);
    const samples = await queryQuantitySamples(identifier, { filter: { date: { startDate, endDate } }, limit: 20, ascending: false, unit: unit as never });
    if (samples.length === 0) return unavailableHkField();
    const latest = samples.reduce((best, s) => (s.endDate.getTime() > best.endDate.getTime() ? s : best));
    return {
      status: latest.quantity === 0 ? 'available_zero' : 'available',
      value: latest.quantity,
      source: describeSource(latest.sourceRevision, latest.device),
      recordedAt: latest.endDate.toISOString(),
      recordCount: samples.length,
    };
  } catch {
    return unavailableHkField();
  }
}

/** Heart Rate: flattens every returned sample and picks the one with the latest actual endDate — never just samples[0]. */
async function fetchLatestHeartRate(): Promise<HealthKitField<number>> {
  try {
    const { startDate, endDate } = recentWindow(2);
    const samples = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', { filter: { date: { startDate, endDate } }, limit: 50, ascending: false, unit: 'count/min' });
    if (samples.length === 0) return unavailableHkField();
    const latest = samples.reduce((best, s) => (s.endDate.getTime() > best.endDate.getTime() ? s : best));
    return {
      status: latest.quantity === 0 ? 'available_zero' : 'available',
      value: latest.quantity,
      source: describeSource(latest.sourceRevision, latest.device),
      recordedAt: latest.endDate.toISOString(),
      recordCount: samples.length,
    };
  } catch {
    return unavailableHkField();
  }
}

/**
 * HealthKit sleep analysis returns many stage segments per night, not one
 * session record. Builds a session from every non-inBed segment in the
 * last 24h: total duration excludes Awake time (matching Apple Health's
 * own "time asleep" figure), stages are summed only from segments that
 * actually appeared — never fabricated.
 */
async function fetchLatestSleepSession(): Promise<HealthKitField<SleepSummary>> {
  try {
    const { startDate, endDate } = recentWindow(1);
    const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { filter: { date: { startDate, endDate } }, limit: 0, ascending: false });
    if (samples.length === 0) return unavailableHkField();

    const stageMinutes = new Map<string, number>();
    let sessionStart: Date | null = null;
    let sessionEnd: Date | null = null;
    let asleepMinutes = 0;
    let latestSample = samples[0];

    for (const sample of samples) {
      if (sample.value === CategoryValueSleepAnalysis.inBed) continue;
      const minutes = (sample.endDate.getTime() - sample.startDate.getTime()) / 60000;
      const label = SLEEP_STAGE_LABELS[sample.value] ?? 'Unknown';
      stageMinutes.set(label, (stageMinutes.get(label) ?? 0) + minutes);
      if (sample.value !== CategoryValueSleepAnalysis.awake) asleepMinutes += minutes;
      if (!sessionStart || sample.startDate.getTime() < sessionStart.getTime()) sessionStart = sample.startDate;
      if (!sessionEnd || sample.endDate.getTime() > sessionEnd.getTime()) sessionEnd = sample.endDate;
      if (sample.endDate.getTime() > latestSample.endDate.getTime()) latestSample = sample;
    }

    if (!sessionStart || !sessionEnd) return unavailableHkField();

    const summary: SleepSummary = {
      totalMinutes: asleepMinutes,
      startTime: sessionStart.toISOString(),
      endTime: sessionEnd.toISOString(),
      stages: Array.from(stageMinutes.entries()).map(([stage, minutes]) => ({ stage, minutes: Math.round(minutes) })),
    };
    return {
      status: 'available',
      value: summary,
      source: describeSource(latestSample.sourceRevision, latestSample.device),
      recordedAt: sessionEnd.toISOString(),
      recordCount: samples.length,
    };
  } catch {
    return unavailableHkField();
  }
}

export async function fetchAllMetrics(): Promise<HealthKitMetrics> {
  if (!isIOS()) return createEmptyHealthKitMetrics();

  const [steps, distanceKm, activeCaloriesKcal, exerciseMinutes, heartRateBpm, restingHeartRateBpm, heartRateVariabilityMillis, spo2Percent, respiratoryRate, bodyTemperatureCelsius, sleep, heightCm, weightKg] =
    await Promise.all([
      fetchAggregateQuantity('HKQuantityTypeIdentifierStepCount', 'count'),
      fetchAggregateQuantity('HKQuantityTypeIdentifierDistanceWalkingRunning', 'km'),
      fetchAggregateQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal'),
      fetchAggregateQuantity('HKQuantityTypeIdentifierAppleExerciseTime', 'min'),
      fetchLatestHeartRate(),
      fetchLatestValue('HKQuantityTypeIdentifierRestingHeartRate', 'count/min', 7),
      fetchLatestValue('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'ms', 7),
      fetchLatestValue('HKQuantityTypeIdentifierOxygenSaturation', '%', 2),
      fetchLatestValue('HKQuantityTypeIdentifierRespiratoryRate', 'count/min', 7),
      fetchLatestValue('HKQuantityTypeIdentifierBodyTemperature', 'degC', 7),
      fetchLatestSleepSession(),
      fetchLatestValue('HKQuantityTypeIdentifierHeight', 'cm', 365),
      fetchLatestValue('HKQuantityTypeIdentifierBodyMass', 'kg', 365),
    ]);

  return { steps, distanceKm, activeCaloriesKcal, exerciseMinutes, heartRateBpm, restingHeartRateBpm, heartRateVariabilityMillis, spo2Percent, respiratoryRate, bodyTemperatureCelsius, sleep, heightCm, weightKg };
}

const QUANTITY_DEBUG_TYPES: [QuantityTypeIdentifier, string][] = [
  ['HKQuantityTypeIdentifierStepCount', 'count'],
  ['HKQuantityTypeIdentifierDistanceWalkingRunning', 'km'],
  ['HKQuantityTypeIdentifierActiveEnergyBurned', 'kcal'],
  ['HKQuantityTypeIdentifierAppleExerciseTime', 'min'],
  ['HKQuantityTypeIdentifierHeartRate', 'count/min'],
  ['HKQuantityTypeIdentifierRestingHeartRate', 'count/min'],
  ['HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'ms'],
  ['HKQuantityTypeIdentifierOxygenSaturation', '%'],
  ['HKQuantityTypeIdentifierRespiratoryRate', 'count/min'],
  ['HKQuantityTypeIdentifierBodyTemperature', 'degC'],
  ['HKQuantityTypeIdentifierHeight', 'cm'],
  ['HKQuantityTypeIdentifierBodyMass', 'kg'],
];

function formatQuantitySummary(identifier: string, value: number, unit: string): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

/** Powers the Developer -> Apple Health Debug section: per-type record counts and recent raw samples with full source metadata. */
export async function fetchDebugInfo(): Promise<HealthKitDebugInfo> {
  const info = createEmptyHealthKitDebugInfo();
  if (!isIOS()) return info;

  await Promise.all(
    QUANTITY_DEBUG_TYPES.map(async ([identifier, unit]) => {
      try {
        const { startDate, endDate } = recentWindow(7);
        const samples = await queryQuantitySamples(identifier, { filter: { date: { startDate, endDate } }, limit: 5, ascending: false, unit: unit as never });
        info.recordCounts[identifier] = samples.length;
        info.recentRecords[identifier] = samples.map(
          (s): HealthKitDebugRecord => ({
            identifier,
            summary: formatQuantitySummary(identifier, s.quantity, unit),
            startTime: s.startDate.toISOString(),
            endTime: s.endDate.toISOString(),
            source: describeSource(s.sourceRevision, s.device),
          })
        );
      } catch {
        info.recordCounts[identifier] = 0;
        info.recentRecords[identifier] = [];
      }
    })
  );

  try {
    const { startDate, endDate } = recentWindow(7);
    const sleepSamples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { filter: { date: { startDate, endDate } }, limit: 5, ascending: false });
    info.recordCounts['HKCategoryTypeIdentifierSleepAnalysis'] = sleepSamples.length;
    info.recentRecords['HKCategoryTypeIdentifierSleepAnalysis'] = sleepSamples.map(
      (s): HealthKitDebugRecord => ({
        identifier: 'HKCategoryTypeIdentifierSleepAnalysis',
        summary: SLEEP_STAGE_LABELS[s.value] ?? 'Unknown',
        startTime: s.startDate.toISOString(),
        endTime: s.endDate.toISOString(),
        source: describeSource(s.sourceRevision, s.device),
      })
    );
  } catch {
    info.recordCounts['HKCategoryTypeIdentifierSleepAnalysis'] = 0;
    info.recentRecords['HKCategoryTypeIdentifierSleepAnalysis'] = [];
  }

  return info;
}
