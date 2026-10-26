import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataRecord, id, num, RecordValue, str } from './laravel';
import { loadAllPages } from './pagination';
import { ApiError } from '@/utils/apiError';
import { Activity, ActivityType, CalorieSource } from '@/features/activity/models';
import { encodePolyline } from '@/utils/geo/polyline';

/**
 * `/activities` — not in the API document; contract verified against the live
 * API on 2026-10-19:
 *  - required: client_id, type, source (manual|tracked|imported), started_at,
 *    ended_at, active_seconds, paused_seconds, calculation_method
 *  - optional: distance_meters, avg_heart_rate, steps, notes, route
 *  - re-verified 2026-10-19 after the backend change: `route` is
 *    `{ encoding: "polyline", points: <encoded string>, point_count }` and
 *    `calories_kcal` may be null (activity logged without a known weight)
 *  - re-posting a known client_id returns 200 with the stored record (idempotent)
 */
export interface ApiActivity {
  serverId: string;
  clientId: string;
  activity: Omit<Activity, 'userId'>;
}

const TYPES: ActivityType[] = ['running', 'walking', 'cycling', 'hiking', 'jogging', 'other'];
const SOURCES: Activity['source'][] = ['manual', 'tracked', 'imported'];
const CALORIE_SOURCES: CalorieSource[] = ['wearable', 'calculated', 'manual'];

function mapActivity(raw: RecordValue): ApiActivity {
  const serverId = id(raw.id);
  const clientId = str(raw.client_id) ?? `server_${serverId}`;
  const startTimestamp = str(raw.started_at);
  if (!startTimestamp) throw new ApiError({ kind: 'malformed' });
  const type = str(raw.type) as ActivityType | undefined;
  const source = str(raw.source) as Activity['source'] | undefined;
  const method = str(raw.calculation_method) as CalorieSource | undefined;
  const activeSeconds = num(raw.active_seconds) ?? 0;
  const distanceMeters = num(raw.distance_meters) ?? null;
  const hours = activeSeconds / 3600;
  return {
    serverId,
    clientId,
    activity: {
      id: clientId,
      type: type && TYPES.includes(type) ? type : 'other',
      startTimestamp,
      endTimestamp: str(raw.ended_at) ?? null,
      activeDuration: activeSeconds * 1000,
      pauseDuration: (num(raw.paused_seconds) ?? 0) * 1000,
      distanceMeters,
      speed: distanceMeters != null && hours > 0 ? distanceMeters / 1000 / hours : null,
      pace: distanceMeters != null && distanceMeters > 0 ? activeSeconds / 60 / (distanceMeters / 1000) : null,
      calories: num(raw.calories_kcal) ?? null,
      calorieSource: method && CALORIE_SOURCES.includes(method) ? method : 'calculated',
      elevationGainMeters: null,
      route: null,
      gpsAvailable: false,
      source: source && SOURCES.includes(source) ? source : 'imported',
      status: 'completed',
      createdAt: str(raw.created_at) ?? startTimestamp,
    },
  };
}

/** Only finished activities can be stored (`ended_at` is required server-side). */
export function isUploadable(activity: Activity): boolean {
  return activity.status === 'completed' && !!activity.endTimestamp;
}

function wire(activity: Activity): RecordValue {
  const data: RecordValue = {
    client_id: activity.id,
    type: activity.type,
    source: activity.source,
    started_at: activity.startTimestamp,
    ended_at: activity.endTimestamp,
    active_seconds: Math.max(0, Math.round(activity.activeDuration / 1000)),
    paused_seconds: Math.max(0, Math.round(activity.pauseDuration / 1000)),
    // Null when no weight was known: the activity still counts, without calories.
    calories_kcal: activity.calories != null && Number.isFinite(activity.calories) ? Math.round(activity.calories) : null,
    calculation_method: activity.calorieSource ?? 'calculated',
  };
  if (activity.distanceMeters != null) data.distance_meters = Math.round(activity.distanceMeters);
  if (activity.route && activity.route.length >= 2) {
    data.route = { encoding: 'polyline', points: encodePolyline(activity.route), point_count: activity.route.length };
  }
  return data;
}

function list(): Promise<ApiActivity[]> {
  return loadAllPages({ method: 'GET', url: API_ENDPOINTS.activities.collection }, 'activities', (raw) => {
    const mapped = mapActivity(raw);
    return { ...mapped, id: mapped.serverId };
  });
}

/** Idempotent on `client_id`: a retry after a lost response returns the same record. */
function upload(activity: Activity): Promise<ApiActivity> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.activities.collection, data: wire(activity) }, (body) => mapActivity(dataRecord(body, 'activity')));
}

async function remove(serverId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.activities.byId(serverId) });
}

export const activitiesApi = { list, upload, remove };
