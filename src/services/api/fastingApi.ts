import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataList, dataRecord, dataRecordOrNull, id, isRecord, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';

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
  };
}

const single = (body: unknown) => mapFast(dataRecord(body, 'fasting'));

function list(): Promise<ApiFast[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.fasting.collection }, (body) => dataList(body, 'fastings').map(mapFast));
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
function start(input: { fastingType: string; plannedHours: number; startedAt: string }): Promise<ApiFast> {
  return apiRequestParsed(
    {
      method: 'POST',
      url: API_ENDPOINTS.fasting.collection,
      data: { fasting_type: input.fastingType, planned_hours: input.plannedHours, started_at: input.startedAt },
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

export const fastingApi = { list, active, get, start, update, end, remove };
