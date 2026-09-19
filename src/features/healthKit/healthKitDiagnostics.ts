/**
 * Lightweight diagnostic helpers for the Apple Health pipeline — mirrors
 * the intent of healthConnect/healthConnectDiagnostics.ts but the iOS
 * pipeline has one fewer hop (no Google-Fit-style bridge to investigate):
 *
 *   Health Source -> Apple Health / HealthKit -> LongLivy
 *
 * LongLivy has no visibility into the health source (Apple Watch or
 * otherwise) beyond what HealthKit already reports as a sample's device
 * metadata — there is no separate "is the watch connected" signal on iOS
 * the way there is a BLE connection state on Android.
 */
import { HealthKitMetrics } from './models';

export type PipelineStageStatus = 'new' | 'old' | 'missing' | 'unknown';

export interface PipelineStage {
  label: string;
  status: PipelineStageStatus;
  detail: string;
}

export interface PipelineVerdict {
  stages: PipelineStage[];
  headline: string;
}

function isNewer(candidate: string | null, baseline: string | null): boolean {
  if (!candidate) return false;
  if (!baseline) return true;
  return new Date(candidate).getTime() > new Date(baseline).getTime();
}

/**
 * Compares what the most recent refresh found against what LongLivy had
 * displayed before it ran — the only genuine before/after split available
 * without a second independent data source to cross-check against.
 */
export function computePipelineVerdict(params: {
  beforeHeartRateRecordedAt: string | null;
  beforeStepsRecordedAt: string | null;
  afterMetrics: HealthKitMetrics;
  longlivyHeartRateRecordedAtAfterRefresh: string | null;
  longlivyStepsRecordedAtAfterRefresh: string | null;
}): PipelineVerdict {
  const { beforeHeartRateRecordedAt, beforeStepsRecordedAt, afterMetrics, longlivyHeartRateRecordedAtAfterRefresh, longlivyStepsRecordedAtAfterRefresh } = params;

  const hrAdvanced = isNewer(afterMetrics.heartRateBpm.recordedAt, beforeHeartRateRecordedAt);
  const stepsAdvanced = isNewer(afterMetrics.steps.recordedAt, beforeStepsRecordedAt);
  const healthKitAdvanced = hrAdvanced || stepsAdvanced;

  const longlivyCaughtUp =
    (!hrAdvanced || longlivyHeartRateRecordedAtAfterRefresh === afterMetrics.heartRateBpm.recordedAt) && (!stepsAdvanced || longlivyStepsRecordedAtAfterRefresh === afterMetrics.steps.recordedAt);

  const stages: PipelineStage[] = [
    {
      label: 'Apple Watch / Health Source',
      status: 'unknown',
      detail: 'LongLivy has no direct visibility into the watch or health source itself — only what HealthKit reports a sample\'s device as.',
    },
    {
      label: 'Apple Health / HealthKit',
      status: healthKitAdvanced ? 'new' : 'old',
      detail: healthKitAdvanced
        ? `Advanced — Heart Rate ${hrAdvanced ? 'newer' : 'unchanged'}, Steps ${stepsAdvanced ? 'newer' : 'unchanged'}.`
        : 'No sample in Apple Health is newer than what LongLivy already had before this refresh.',
    },
    {
      label: 'LongLivy',
      status: !healthKitAdvanced ? 'old' : longlivyCaughtUp ? 'new' : 'missing',
      detail: !healthKitAdvanced ? 'Nothing new to read yet.' : longlivyCaughtUp ? 'Read the new HealthKit sample successfully.' : 'HealthKit has newer data than LongLivy is currently displaying — an app-side staleness issue, not an upstream delay.',
    },
  ];

  let headline: string;
  if (!healthKitAdvanced) {
    headline = 'No newer HealthKit record is available yet.';
  } else if (longlivyCaughtUp) {
    headline = 'Apple Health has the new data and LongLivy is reading it.';
  } else {
    headline = 'HealthKit contains newer data; LongLivy query/state is stale.';
  }

  return { stages, headline };
}
