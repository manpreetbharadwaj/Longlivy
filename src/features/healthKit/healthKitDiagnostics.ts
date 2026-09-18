/**
 * Lightweight diagnostic helpers for the Apple Health pipeline — mirrors
 * the intent of healthConnect/healthConnectDiagnostics.ts but the iOS
 * pipeline has one fewer hop (no Google-Fit-style bridge to investigate):
 *
 *   Health Source -> Apple Health / HealthKit -> HealthyMe
 *
 * HealthyMe has no visibility into the health source (Apple Watch or
 * otherwise) beyond what HealthKit already reports as a sample's device
 * metadata — there is no separate "is the watch connected" signal on iOS
 * the way there is a BLE connection state on Android.
 */
import { HealthKitMetrics } from './models';
import { brand } from '@/config/branding';

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
 * Compares what the most recent refresh found against what HealthyMe had
 * displayed before it ran — the only genuine before/after split available
 * without a second independent data source to cross-check against.
 */
export function computePipelineVerdict(params: {
  beforeHeartRateRecordedAt: string | null;
  beforeStepsRecordedAt: string | null;
  afterMetrics: HealthKitMetrics;
  appHeartRateRecordedAtAfterRefresh: string | null;
  appStepsRecordedAtAfterRefresh: string | null;
}): PipelineVerdict {
  const { beforeHeartRateRecordedAt, beforeStepsRecordedAt, afterMetrics, appHeartRateRecordedAtAfterRefresh, appStepsRecordedAtAfterRefresh } = params;

  const hrAdvanced = isNewer(afterMetrics.heartRateBpm.recordedAt, beforeHeartRateRecordedAt);
  const stepsAdvanced = isNewer(afterMetrics.steps.recordedAt, beforeStepsRecordedAt);
  const healthKitAdvanced = hrAdvanced || stepsAdvanced;

  const appCaughtUp =
    (!hrAdvanced || appHeartRateRecordedAtAfterRefresh === afterMetrics.heartRateBpm.recordedAt) && (!stepsAdvanced || appStepsRecordedAtAfterRefresh === afterMetrics.steps.recordedAt);

  const stages: PipelineStage[] = [
    {
      label: 'Apple Watch / Health Source',
      status: 'unknown',
      detail: `${brand.name} has no direct visibility into the watch or health source itself — only what HealthKit reports a sample's device as.`,
    },
    {
      label: 'Apple Health / HealthKit',
      status: healthKitAdvanced ? 'new' : 'old',
      detail: healthKitAdvanced
        ? `Advanced — Heart Rate ${hrAdvanced ? 'newer' : 'unchanged'}, Steps ${stepsAdvanced ? 'newer' : 'unchanged'}.`
        : `No sample in Apple Health is newer than what ${brand.name} already had before this refresh.`,
    },
    {
      label: brand.name,
      status: !healthKitAdvanced ? 'old' : appCaughtUp ? 'new' : 'missing',
      detail: !healthKitAdvanced ? 'Nothing new to read yet.' : appCaughtUp ? 'Read the new HealthKit sample successfully.' : `HealthKit has newer data than ${brand.name} is currently displaying — an app-side staleness issue, not an upstream delay.`,
    },
  ];

  let headline: string;
  if (!healthKitAdvanced) {
    headline = 'No newer HealthKit record is available yet.';
  } else if (appCaughtUp) {
    headline = 'Apple Health has the new data and it is being read correctly.';
  } else {
    headline = 'HealthKit contains newer data; the app query/state is stale.';
  }

  return { stages, headline };
}
