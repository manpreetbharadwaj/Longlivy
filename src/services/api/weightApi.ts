import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataRecord, id, num, RecordValue, str } from './laravel';
import { ApiError } from '@/utils/apiError';
import { WeightEntry } from '@/features/weight/models';
import { loadAllPages } from './pagination';

const LB_TO_KG = 0.45359237;

const SOURCES: WeightEntry['source'][] = ['manual', 'health_platform', 'wearable'];

/** `{ id, weight: "72.50", unit: "kg", logged_at, date, source, notes }` */
export function mapWeightLog(raw: RecordValue, userId: string): WeightEntry {
  const weight = num(raw.weight);
  const timestamp = str(raw.logged_at) ?? str(raw.date);
  if (weight === undefined || !timestamp) throw new ApiError({ kind: 'malformed' });
  const source = str(raw.source) as WeightEntry['source'] | undefined;
  return {
    id: id(raw.id),
    userId,
    timestamp,
    weightKg: str(raw.unit) === 'lb' ? Math.round(weight * LB_TO_KG * 10) / 10 : weight,
    source: source && SOURCES.includes(source) ? source : 'manual',
  };
}

function list(userId: string): Promise<WeightEntry[]> {
  return loadAllPages({ method: 'GET', url: API_ENDPOINTS.weightLogs.collection }, 'weight_logs', (raw) => mapWeightLog(raw, userId));
}

function create(userId: string, weightKg: number, source: WeightEntry['source']): Promise<WeightEntry> {
  return apiRequestParsed(
    { method: 'POST', url: API_ENDPOINTS.weightLogs.collection, data: { weight: weightKg, unit: 'kg', source } },
    (body) => mapWeightLog(dataRecord(body, 'weight_log'), userId),
  );
}

/** PUT keeps the entry's unit as kg (the app only edits values it shows in kg). */
function update(userId: string, entryId: string, weightKg: number): Promise<WeightEntry> {
  return apiRequestParsed(
    { method: 'PUT', url: API_ENDPOINTS.weightLogs.byId(entryId), data: { weight: weightKg, unit: 'kg' } },
    (body) => mapWeightLog(dataRecord(body, 'weight_log'), userId),
  );
}

async function remove(entryId: string): Promise<void> {
  await apiRequest({ method: 'DELETE', url: API_ENDPOINTS.weightLogs.byId(entryId) });
}

export const weightApi = { list, create, update, remove };
