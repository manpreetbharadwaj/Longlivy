import { readRecords, aggregateRecord, ExerciseType } from 'react-native-health-connect';
import type { ExerciseSessionRecord } from 'react-native-health-connect';
import { Activity, ActivityType } from '@/features/activity/models';
import { activitiesApi } from '@/services/api/activitiesApi';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { recentWindow } from '../healthConnectService';

/**
 * Imports completed `ExerciseSession` records Health Connect already holds
 * (written there by a smartwatch app, Google Fit, etc.) into LongLivy's own
 * Activity history, through the exact same `/activities` endpoint LongLivy's
 * own GPS tracking already uploads to (see activitiesApi.ts) — no new
 * backend route, same idempotent client_id contract. Every imported record
 * is tagged `source: 'imported'` with `sourceId` set to Health Connect's own
 * record id, which is this module's whole dedup key.
 */

/** Health Connect record ids already turned into a LongLivy Activity — read before every import pass so a record already sent is never sent twice. */
const importedIdsStore = new LocalStore<string[]>('@longlivy/healthconnect_imported_ids', []);

const EXERCISE_TYPE_TO_ACTIVITY_TYPE: Record<number, ActivityType> = {
  [ExerciseType.RUNNING]: 'running',
  [ExerciseType.RUNNING_TREADMILL]: 'running',
  [ExerciseType.WALKING]: 'walking',
  [ExerciseType.HIKING]: 'hiking',
  [ExerciseType.BIKING]: 'cycling',
  [ExerciseType.BIKING_STATIONARY]: 'cycling',
};

function mapExerciseType(exerciseType: number): ActivityType {
  return EXERCISE_TYPE_TO_ACTIVITY_TYPE[exerciseType] ?? 'other';
}

/** Fraction of the shorter session's duration that overlaps the other — used to skip importing a Health Connect session that's really the same workout LongLivy already tracked by GPS (e.g. a watch mirroring the same run). */
function overlapFraction(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const overlapMs = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  if (overlapMs <= 0) return 0;
  const shorterMs = Math.min(aEnd - aStart, bEnd - bStart);
  return shorterMs > 0 ? overlapMs / shorterMs : 0;
}

async function sessionAggregate(
  recordType: 'Distance' | 'ActiveCaloriesBurned',
  startTime: string,
  endTime: string,
  extract: (result: any) => number | null
): Promise<number | null> {
  try {
    const result = await aggregateRecord({ recordType, timeRangeFilter: { operator: 'between', startTime, endTime } } as any);
    const value = extract(result);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export interface HealthConnectImportResult {
  imported: number;
  skippedAlreadyImported: number;
  skippedOverlapsTracked: number;
}

/**
 * `existingActivities` should be the user's current Activity history
 * (LongLivy-tracked + previously-imported) — the overlap check runs against
 * it so a watch's own copy of a GPS-tracked run isn't double-counted as a
 * second activity, and a Health Connect session already imported on a prior
 * sync isn't re-uploaded.
 */
export async function importHealthConnectWorkouts(
  userId: string,
  existingActivities: Activity[],
  windowDays = 30
): Promise<HealthConnectImportResult> {
  const result: HealthConnectImportResult = { imported: 0, skippedAlreadyImported: 0, skippedOverlapsTracked: 0 };

  let records: ExerciseSessionRecord[];
  try {
    const response = await readRecords('ExerciseSession', { timeRangeFilter: recentWindow(windowDays) });
    records = response.records as ExerciseSessionRecord[];
  } catch {
    return result;
  }

  const alreadyImported = new Set(await importedIdsStore.read());
  const nextImported = [...alreadyImported];

  for (const record of records) {
    const recordId = record.metadata?.id;
    if (!recordId) continue;
    if (alreadyImported.has(recordId)) {
      result.skippedAlreadyImported += 1;
      continue;
    }

    const startMs = new Date(record.startTime).getTime();
    const endMs = new Date(record.endTime).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) continue;

    const overlapsTracked = existingActivities.some((activity) => {
      if (!activity.endTimestamp) return false;
      const existingStart = new Date(activity.startTimestamp).getTime();
      const existingEnd = new Date(activity.endTimestamp).getTime();
      return overlapFraction(startMs, endMs, existingStart, existingEnd) > 0.5;
    });
    if (overlapsTracked) {
      result.skippedOverlapsTracked += 1;
      nextImported.push(recordId); // Never worth re-checking this one again — it's the same workout, by construction.
      continue;
    }

    const [distanceMeters, activeCaloriesKcal] = await Promise.all([
      sessionAggregate('Distance', record.startTime, record.endTime, (r) => r.DISTANCE?.inMeters ?? null),
      sessionAggregate('ActiveCaloriesBurned', record.startTime, record.endTime, (r) => r.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? null),
    ]);

    const activity: Activity = {
      id: generateId('activity'),
      userId,
      type: mapExerciseType(record.exerciseType),
      startTimestamp: record.startTime,
      endTimestamp: record.endTime,
      activeDuration: endMs - startMs,
      pauseDuration: 0,
      distanceMeters,
      pace: null,
      speed: null,
      calories: activeCaloriesKcal != null ? Math.round(activeCaloriesKcal) : null,
      calorieSource: activeCaloriesKcal != null ? 'wearable' : null,
      elevationGainMeters: null,
      route: null,
      gpsAvailable: false,
      source: 'imported',
      sourceId: recordId,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    try {
      await activitiesApi.upload(activity);
      nextImported.push(recordId);
      result.imported += 1;
    } catch {
      // Left off `nextImported` on purpose — retried on the next Sync Now.
    }
  }

  await importedIdsStore.write(nextImported);
  return result;
}
