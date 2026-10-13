import { ApiError } from '@/utils/apiError';

/**
 * Shared parsing helpers for the LongLivy Laravel API. Every success body is
 * `{ success: true, message, data: { <key>: ... } }`, and decimal columns are
 * serialized as strings ("72.50"), so mappers must coerce rather than cast.
 */

export type RecordValue = Record<string, unknown>;

export function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Accepts numbers and Laravel's decimal strings; anything else is undefined. */
export function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Ids are integers on the wire; the app keeps every id as a string. */
export function id(value: unknown): string {
  const parsed = str(value);
  if (!parsed) throw new ApiError({ kind: 'malformed' });
  return parsed;
}

/** Returns `data.<key>` from the standard envelope, or throws `malformed`. */
export function dataField(body: unknown, key: string): unknown {
  if (!isRecord(body) || !isRecord(body.data) || !(key in body.data)) {
    throw new ApiError({ kind: 'malformed' });
  }
  return body.data[key];
}

export function dataRecord(body: unknown, key: string): RecordValue {
  const value = dataField(body, key);
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  return value;
}

/** A nullable single record, e.g. `data.fasting: null` when nothing is active. */
export function dataRecordOrNull(body: unknown, key: string): RecordValue | null {
  const value = dataField(body, key);
  if (value === null) return null;
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  return value;
}

export function dataList(body: unknown, key: string): RecordValue[] {
  const value = dataField(body, key);
  if (!Array.isArray(value)) throw new ApiError({ kind: 'malformed' });
  return value.filter(isRecord);
}

/** Local calendar day as `YYYY-MM-DD`, the format every `date` field uses. */
export function localDateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Normalizes "08:00:00" (returned after updates) and "08:00" to "08:00". */
export function hhmm(value: unknown): string | undefined {
  const raw = str(value);
  const match = raw?.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 ? `${String(hours).padStart(2, '0')}:${match[2]}` : undefined;
}
