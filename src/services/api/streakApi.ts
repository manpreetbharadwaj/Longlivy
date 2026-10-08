import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { ApiError } from '@/utils/apiError';

export interface StreakApiRecord {
  current: number;
  longest?: number;
  type?: string;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function normalizeStreak(value: unknown): StreakApiRecord {
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  const data = isRecord(value.data) ? value.data : value;
  // Single: `data.streak`; list items arrive already unwrapped.
  const body = isRecord(data.streak) ? data.streak : data;
  const current = finiteNumber(body.current) ?? finiteNumber(body.currentStreak) ?? finiteNumber(body.current_streak);
  if (current === undefined) throw new ApiError({ kind: 'malformed' });
  return {
    ...body,
    current,
    longest: finiteNumber(body.longest) ?? finiteNumber(body.longestStreak) ?? finiteNumber(body.longest_streak),
    type: stringValue(body.type),
  };
}

function getStreaks(signal?: AbortSignal): Promise<StreakApiRecord[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.streaks.collection, signal }, (value) => {
    if (Array.isArray(value)) return value.map(normalizeStreak);
    if (isRecord(value) && Array.isArray(value.streaks)) return value.streaks.map(normalizeStreak);
    if (isRecord(value) && isRecord(value.data) && Array.isArray(value.data.streaks)) return value.data.streaks.map(normalizeStreak);
    return [normalizeStreak(value)];
  });
}

function getStreak(type: string, signal?: AbortSignal): Promise<StreakApiRecord> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.streaks.byType(type), signal }, normalizeStreak);
}

export const streakApi = { getStreaks, getStreak };
