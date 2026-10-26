import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataRecord, dataRecordOrNull, id, isRecord, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';
import { loadAllPages } from './pagination';

/**
 * `/fasting` record, verified 2026-10-08:
 * `{ id, fasting_type, planned_hours, status: ongoing|completed|failed,
 *    is_active, started_at, ended_at, actual_hours: "2.00", notes, ... }`
 * `planned_hours` is an integer 1..48; `fasting_type` is free text.
 */
export interface ApiFast {
  id: string;
  fastingType: string;
  plannedHours: number;
  status: 'ongoing' | 'completed' | 'failed' | 'cancelled' | string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  actualHours: number | null;
  elapsedHours: number | null;
}

export const MAX_PLANNED_HOURS = 48;

function mapFast(raw: RecordValue): ApiFast {
  const startedAt = str(raw.started_at);
  const plannedHours = num(raw.planned_hours);
  if (!startedAt || plannedHours === undefined) throw new ApiError({ kind: 'malformed' });
  return {
    id: id(raw.id),
    fastingType: str(raw.fasting_type) ?? 'individual',
    plannedHours,
    status: str(raw.status) ?? (raw.is_active ? 'ongoing' : 'completed'),
    startedAt,
    endedAt: str(raw.ended_at) ?? null,
    createdAt: str(raw.created_at) ?? startedAt,
    updatedAt: str(raw.updated_at) ?? startedAt,
    actualHours: num(raw.actual_hours) ?? null,
    elapsedHours: num(raw.elapsed_hours) ?? null,
  };
}

const single = (body: unknown) => mapFast(dataRecord(body, 'fasting'));

function list(): Promise<ApiFast[]> {
  return loadAllPages({ method: 'GET', url: API_ENDPOINTS.fasting.collection }, 'fastings', mapFast);
}

function active(): Promise<ApiFast | null> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.fasting.active }, (body) => {
    const raw = dataRecordOrNull(body, 'fasting');
    return raw ? mapFast(raw) : null;
  });
}

function get(fastId: string): Promise<ApiFast> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.fasting.byId(fastId) }, single);
}

/** Rejects with a `conflict`-like validation error when a fast is already running. */
function start(input: { fastingType: string; plannedHours: number; startedAt: string; fastingPlanId?: string }): Promise<ApiFast> {
  return apiRequestParsed(
    {
      method: 'POST',
      url: API_ENDPOINTS.fasting.collection,
      data: {
        fasting_type: input.fastingType,
        planned_hours: input.plannedHours,
        started_at: input.startedAt,
        ...(input.fastingPlanId ? { fasting_plan_id: Number(input.fastingPlanId) } : {}),
      },
    },
    single,
  );
}

/** PUT accepts `fasting_type`/`planned_hours`/`notes`; `started_at` is silently ignored by the server. */
function update(fastId: string, changes: { fastingType?: string; plannedHours?: number }): Promise<ApiFast> {
  const data: RecordValue = {};
  if (changes.fastingType !== undefined) data.fasting_type = changes.fastingType;
  if (changes.plannedHours !== undefined) data.planned_hours = changes.plannedHours;
  return apiRequestParsed({ method: 'PUT', url: API_ENDPOINTS.fasting.byId(fastId), data }, single);
}

/** The server marks the fast `completed` if it reached its planned hours, otherwise `failed`. */
function end(fastId: string, endedAt?: string): Promise<ApiFast> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.fasting.end(fastId), data: endedAt ? { ended_at: endedAt } : {} }, single);
}

async function remove(fastId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.fasting.byId(fastId) });
}

/** True for the 422 the API returns when a second fast is started. */
export function isFastAlreadyActiveError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'validation' && isRecord(error.validationErrors) && 'fasting' in error.validationErrors;
}

// --- fasting plans ----------------------------------------------------------

/**
 * `/fasting/plans` — not in the API document; verified 2026-10-19 after the
 * backend fix: GET (list), POST, GET/PUT/DELETE by id. Weekdays round-trip
 * exactly; activating a plan deactivates the user's other plans; every app
 * method id (14:10 … 96h, individual) is accepted. Per-day overrides have only
 * GET and DELETE-by-date routes (no create), so they stay on the device.
 */
export interface ApiFastingPlan {
  id: string;
  method: string;
  category: string;
  recurring: boolean;
  startTime: string;
  endTime: string;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  timezone: string;
  active: boolean;
  fastingHours: number | null;
  eatingHours: number | null;
  notificationSettings: { fastingBegins: boolean; fastingEnds: boolean; eatingPhaseBegins: boolean } | null;
}

export type ApiFastingPlanInput = Omit<ApiFastingPlan, 'id'>;

function mapPlan(raw: RecordValue): ApiFastingPlan {
  const method = str(raw.method);
  const startTime = str(raw.start_time);
  const endTime = str(raw.end_time);
  const startDate = str(raw.start_date);
  if (!method || !startTime || !endTime || !startDate) throw new ApiError({ kind: 'malformed' });
  const weekdays = Array.isArray(raw.weekdays) ? raw.weekdays.map(num).filter((d): d is number => d !== undefined && Number.isInteger(d) && d >= 0 && d <= 6) : [];
  const ns = isRecord(raw.notification_settings) ? raw.notification_settings : null;
  return {
    id: id(raw.id),
    method,
    category: str(raw.category) ?? 'intermittent',
    recurring: raw.recurring !== false,
    startTime: startTime.slice(0, 5),
    endTime: endTime.slice(0, 5),
    weekdays,
    startDate: startDate.slice(0, 10),
    endDate: str(raw.end_date)?.slice(0, 10) ?? null,
    timezone: str(raw.timezone) ?? 'UTC',
    active: raw.active === true,
    fastingHours: num(raw.fasting_hours) ?? null,
    eatingHours: num(raw.eating_hours) ?? null,
    notificationSettings: ns
      ? { fastingBegins: ns.fasting_begins !== false, fastingEnds: ns.fasting_ends !== false, eatingPhaseBegins: ns.eating_phase_begins !== false }
      : null,
  };
}

function planWire(input: ApiFastingPlanInput): RecordValue {
  return {
    method: input.method,
    category: input.category,
    recurring: input.recurring,
    start_time: input.startTime,
    end_time: input.endTime,
    weekdays: input.weekdays,
    start_date: input.startDate,
    end_date: input.endDate,
    timezone: input.timezone,
    active: input.active,
    ...(input.fastingHours != null ? { fasting_hours: input.fastingHours } : {}),
    ...(input.eatingHours != null ? { eating_hours: input.eatingHours } : {}),
    ...(input.notificationSettings
      ? {
          notification_settings: {
            fasting_begins: input.notificationSettings.fastingBegins,
            fasting_ends: input.notificationSettings.fastingEnds,
            eating_phase_begins: input.notificationSettings.eatingPhaseBegins,
          },
        }
      : {}),
  };
}

function listPlans(): Promise<ApiFastingPlan[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.fasting.plans }, (body) => {
    if (!isRecord(body) || !isRecord(body.data) || !Array.isArray(body.data.plans)) throw new ApiError({ kind: 'malformed' });
    return body.data.plans.filter(isRecord).map(mapPlan);
  });
}

function savePlan(planId: string | null, input: ApiFastingPlanInput): Promise<ApiFastingPlan> {
  const data = planWire(input);
  return apiRequestParsed(
    planId ? { method: 'PUT', url: API_ENDPOINTS.fasting.plan(planId), data } : { method: 'POST', url: API_ENDPOINTS.fasting.plans, data },
    (body) => mapPlan(dataRecord(body, 'plan')),
  );
}

async function deletePlanOverride(planId: string, date: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: `${API_ENDPOINTS.fasting.plan(planId)}/overrides/${encodeURIComponent(date)}` });
}

async function deletePlan(planId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.fasting.plan(planId) });
}

export const fastingApi = { list, active, get, start, update, end, remove, listPlans, savePlan, deletePlan, deletePlanOverride };
