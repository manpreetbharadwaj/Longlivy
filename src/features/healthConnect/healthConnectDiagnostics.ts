/**
 * TEMPORARY diagnostic module — not part of the production Health Connect
 * read path (see healthConnectService.ts / healthConnectSlice.ts, both
 * untouched by this file). Its only job is to answer one question with real
 * records instead of guesses: where exactly does a new measurement stop
 * showing up — Google Fit, Health Connect, or the app's own state?
 *
 * Hard limitation, stated up front: the app has no supported way to query
 * Google Fit directly (the Google Fit REST/Sensors/History APIs are
 * deprecated and explicitly off-limits here). Every "Google Fit" number
 * below is actually "the most recent Health Connect record whose
 * dataOrigin is Google Fit's package" — i.e. Google Fit's data AS FAR AS
 * HEALTH CONNECT HAS SEEN IT, not a live read of Google Fit itself. If
 * Health Connect shows no advance, the only way to tell whether Google Fit
 * itself already has the new measurement is to open Google Fit's own app.
 * This module never blurs that line — every place it reports a "Google
 * Fit" value, the label says so.
 */
import { readRecords, aggregateRecord, getChanges } from 'react-native-health-connect';
import type { RecordType } from 'react-native-health-connect';
import { describeSource, todayRange } from './healthConnectService';
import { HealthConnectSource } from './models';
import { brand } from '@/config/branding';

const GOOGLE_FIT_PACKAGE = 'com.google.android.apps.fitness';

function windowFilter(hours: number) {
  const now = new Date();
  const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return { operator: 'between' as const, startTime: start.toISOString(), endTime: now.toISOString() };
}

export interface HeartRateDiagnosticSample {
  value: number;
  sampleTime: string;
  parentRecordStartTime: string;
  parentRecordEndTime: string;
  source: HealthConnectSource | 'unknown';
}

export interface HeartRateDiagnostic {
  /** Up to the 10 most recent samples across all HeartRate records in the last 48h, most recent first. Each HeartRate "record" can itself hold many samples — this flattens all of them so nothing is hidden inside a record the app's production path already summarized to one value. */
  samples: HeartRateDiagnosticSample[];
  /** Freshest sample time found — null if nothing in the window. */
  latestSampleTime: string | null;
}

export interface StepsIndividualRecordDiagnostic {
  count: number;
  startTime: string;
  endTime: string;
  source: HealthConnectSource | 'unknown';
}

export interface StepsDiagnostic {
  /** Up to the 10 most recent individual (non-aggregate) Steps records in the last 24h, most recent first — shown separately from the aggregate so a discrepancy between "a new record exists" and "the aggregate total changed" is visible instead of hidden behind one number. */
  individualRecords: StepsIndividualRecordDiagnostic[];
  /** Today's official aggregate total — same figure the production Activity card shows, repeated here for direct side-by-side comparison. */
  aggregateTotal: number | null;
  aggregateSourceCount: number;
  latestIndividualRecordTime: string | null;
}

export interface ChangesDiagnostic {
  /** False only if this Health Connect version's client rejected the getChanges call outright — every device tested so far has supported it. */
  supported: boolean;
  error: string | null;
  /** True on the very first call ever (or after a token expired) — there is nothing to compare against yet, so changeCount is meaningless this round. */
  isBaseline: boolean;
  changeCount: number;
  latestChangeSummaries: string[];
}

/** recordType -> human summary, kept local and deliberately generic since the changes API can return any record type. */
function summarizeChangeRecord(record: { recordType: string } & Record<string, unknown>): string {
  const r = record as any;
  switch (record.recordType) {
    case 'HeartRate':
      return `HeartRate · ${r.samples?.length ?? 0} sample(s) · ${r.startTime ?? ''}`;
    case 'Steps':
      return `Steps · ${r.count} · ${r.startTime ?? ''}`;
    default:
      return `${record.recordType} · ${r.time ?? r.startTime ?? ''}`;
  }
}

/**
 * Flattens every sample from every HeartRate record in the last 48h — the
 * richest possible view, since production's fetchLatestHeartRate() already
 * collapses this to a single "latest" value.
 */
export async function fetchHeartRateDiagnostic(): Promise<HeartRateDiagnostic> {
  const { records } = await readRecords('HeartRate', { timeRangeFilter: windowFilter(48) });
  const flattened: HeartRateDiagnosticSample[] = [];
  for (const record of records) {
    for (const sample of record.samples) {
      flattened.push({
        value: sample.beatsPerMinute,
        sampleTime: sample.time,
        parentRecordStartTime: record.startTime,
        parentRecordEndTime: record.endTime,
        source: describeSource(record.metadata),
      });
    }
  }
  flattened.sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime());
  return { samples: flattened.slice(0, 10), latestSampleTime: flattened[0]?.sampleTime ?? null };
}

/** Individual Steps records (never used for the production total — that stays on the official aggregate) alongside today's aggregate, for direct comparison. */
export async function fetchStepsDiagnostic(): Promise<StepsDiagnostic> {
  const [{ records }, aggregate] = await Promise.all([
    readRecords('Steps', { timeRangeFilter: windowFilter(24) }),
    aggregateRecord({ recordType: 'Steps', timeRangeFilter: todayRange() } as any).catch(() => null),
  ]);
  const sorted = [...records].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const individualRecords = sorted.slice(0, 10).map((r) => ({
    count: r.count,
    startTime: r.startTime,
    endTime: r.endTime,
    source: describeSource(r.metadata),
  }));
  return {
    individualRecords,
    aggregateTotal: (aggregate as any)?.COUNT_TOTAL ?? null,
    aggregateSourceCount: (aggregate as any)?.dataOrigins?.length ?? 0,
    latestIndividualRecordTime: individualRecords[0]?.startTime ?? null,
  };
}

/**
 * Health Connect's official change-tracking API — diagnostic-only, never
 * used to insert/delete anything. The first call in a fresh app session
 * only establishes a baseline token (there is nothing to diff against
 * yet); every call after that reports what changed since the previous
 * Deep Refresh. The token is kept in memory only — it deliberately does
 * not survive an app restart, since this is a debugging aid, not a
 * production sync mechanism.
 */
let changesToken: string | null = null;

export async function fetchChangesDiagnostic(recordTypes: RecordType[]): Promise<ChangesDiagnostic> {
  try {
    if (!changesToken) {
      const baseline = await getChanges({ recordTypes });
      changesToken = baseline.nextChangesToken;
      return { supported: true, error: null, isBaseline: true, changeCount: 0, latestChangeSummaries: [] };
    }
    const result = await getChanges({ changesToken, recordTypes });
    if (result.changesTokenExpired) {
      changesToken = null;
      return { supported: true, error: 'Token expired — re-baselined, run Deep Refresh again to see changes.', isBaseline: true, changeCount: 0, latestChangeSummaries: [] };
    }
    changesToken = result.nextChangesToken;
    return {
      supported: true,
      error: null,
      isBaseline: false,
      changeCount: result.upsertionChanges.length,
      latestChangeSummaries: result.upsertionChanges.slice(0, 10).map((c) => summarizeChangeRecord(c.record as any)),
    };
  } catch (error) {
    return { supported: false, error: error instanceof Error ? error.message : 'changes_api_unavailable', isBaseline: false, changeCount: 0, latestChangeSummaries: [] };
  }
}

export interface DeepRefreshResult {
  ranAt: string;
  heartRate: HeartRateDiagnostic;
  steps: StepsDiagnostic;
  changes: ChangesDiagnostic;
}

const CHANGES_RECORD_TYPES: RecordType[] = ['Steps', 'HeartRate'];

export async function runDeepRefresh(): Promise<DeepRefreshResult> {
  const [heartRate, steps, changes] = await Promise.all([fetchHeartRateDiagnostic(), fetchStepsDiagnostic(), fetchChangesDiagnostic(CHANGES_RECORD_TYPES)]);
  return { ranAt: new Date().toISOString(), heartRate, steps, changes };
}

export type PipelineStageStatus = 'new' | 'old' | 'missing' | 'unknown';

export interface PipelineStage {
  label: string;
  status: PipelineStageStatus;
  detail: string;
}

export interface PipelineVerdict {
  stages: PipelineStage[];
  /** The one honest headline sentence — always one of the four outcomes the diagnostic can actually distinguish. */
  headline: string;
}

function isSourceGoogleFit(source: HealthConnectSource | 'unknown'): boolean {
  return source !== 'unknown' && source.packageName === GOOGLE_FIT_PACKAGE;
}

/**
 * Compares what THIS Deep Refresh found in Health Connect against what the
 * app had already displayed before it ran. This is the only genuine
 * three-way split available without leaving the app: did Health Connect
 * advance, and if so, did the app's own state catch up.
 *
 * Previously included a "Noise Watch (BLE)"/"NoiseFit" stage — dropped
 * along with the rest of the Noise smartwatch BLE integration (see
 * PHASE_0_AUDIT.md §8); Health Connect/HealthKit are the only wearable
 * data sources now, so this pipeline starts at Google Fit.
 */
export function computePipelineVerdict(params: {
  beforeHeartRateRecordedAt: string | null;
  beforeStepsRecordedAt: string | null;
  afterHeartRateDiagnostic: HeartRateDiagnostic;
  afterStepsDiagnostic: StepsDiagnostic;
  /** The app's Redux state AFTER the production refresh that Deep Refresh also triggers — used to catch an app-side staleness bug distinct from an upstream one. */
  appHeartRateRecordedAtAfterRefresh: string | null;
  appStepsRecordedAtAfterRefresh: string | null;
}): PipelineVerdict {
  const {
    beforeHeartRateRecordedAt,
    beforeStepsRecordedAt,
    afterHeartRateDiagnostic,
    afterStepsDiagnostic,
    appHeartRateRecordedAtAfterRefresh,
    appStepsRecordedAtAfterRefresh,
  } = params;

  const hrAdvanced = isNewer(afterHeartRateDiagnostic.latestSampleTime, beforeHeartRateRecordedAt);
  const stepsAdvanced = isNewer(afterStepsDiagnostic.latestIndividualRecordTime, beforeStepsRecordedAt);
  const healthConnectAdvanced = hrAdvanced || stepsAdvanced;

  const hrGoogleFitSource = afterHeartRateDiagnostic.samples[0] ? isSourceGoogleFit(afterHeartRateDiagnostic.samples[0].source) : false;

  const appCaughtUp =
    (!hrAdvanced || appHeartRateRecordedAtAfterRefresh === afterHeartRateDiagnostic.latestSampleTime) &&
    (!stepsAdvanced || appStepsRecordedAtAfterRefresh === afterStepsDiagnostic.latestIndividualRecordTime);

  const stages: PipelineStage[] = [
    {
      label: 'Google Fit (as reflected in Health Connect)',
      status: healthConnectAdvanced && hrGoogleFitSource ? 'new' : healthConnectAdvanced ? 'new' : 'old',
      detail: healthConnectAdvanced
        ? 'A newer record attributed to Google Fit reached Health Connect.'
        : 'No newer Google-Fit-attributed record in Health Connect yet — this could mean Google Fit itself has nothing new, OR it has the new reading but hasn\'t pushed it to Health Connect yet. Open Google Fit directly to tell which.',
    },
    {
      label: 'Health Connect',
      status: healthConnectAdvanced ? 'new' : 'old',
      detail: healthConnectAdvanced
        ? `Advanced — Heart Rate ${hrAdvanced ? 'newer' : 'unchanged'}, Steps ${stepsAdvanced ? 'newer' : 'unchanged'}.`
        : `No record in Health Connect is newer than what ${brand.name} already had before this Deep Refresh.`,
    },
    {
      label: brand.name,
      status: !healthConnectAdvanced ? 'old' : appCaughtUp ? 'new' : 'missing',
      detail: !healthConnectAdvanced ? 'Nothing new to read yet.' : appCaughtUp ? 'Read the new Health Connect record successfully.' : `Health Connect has newer data than ${brand.name} is currently displaying — this is an app-side staleness bug, not an upstream delay.`,
    },
  ];

  let headline: string;
  if (!healthConnectAdvanced) {
    headline = 'No new record reached Health Connect since before this Deep Refresh. Open Google Fit directly to check whether it already has the new measurement.';
  } else if (appCaughtUp) {
    headline = `Health Connect has the new data and ${brand.name} is reading it.`;
  } else {
    headline = `Health Connect has newer data than ${brand.name} is currently displaying — its query/state is stale (app-side issue).`;
  }

  return { stages, headline };
}

function isNewer(candidate: string | null, baseline: string | null): boolean {
  if (!candidate) return false;
  if (!baseline) return true;
  return new Date(candidate).getTime() > new Date(baseline).getTime();
}
