import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { isRecord, num, RecordValue, str } from './laravel';
import { streakApi } from './streakApi';
import { ApiError } from '@/utils/apiError';

/**
 * Server-computed aggregates the app shows on the dashboard and statistics
 * screens (all verified live 2026-10-08). The server is authoritative for
 * streak rules and totals across devices.
 */

export interface FastingSummary {
  total: number;
  completed: number;
  failed: number;
  totalHours: number;
  averageHours: number;
  longestHours: number;
  currentStreak: number;
}

export interface MeditationStats {
  totalSessions: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface EnergyBalance {
  date: string;
  bmr: number;
  everydayActivity: number;
  /** Activity the server knows about (sport + manual + imported). */
  serverActivity: number;
  intake: number;
  calorieGoal: number | null;
}

function body(value: unknown): RecordValue {
  if (!isRecord(value) || !isRecord(value.data)) throw new ApiError({ kind: 'malformed' });
  return value.data;
}

function fastingSummary(): Promise<FastingSummary> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.fasting.summary }, (value) => {
    const d = body(value);
    const streak = isRecord(d.streak) ? d.streak : {};
    return {
      total: num(d.total) ?? 0,
      completed: num(d.completed) ?? 0,
      failed: num(d.failed) ?? 0,
      totalHours: num(d.total_hours) ?? 0,
      averageHours: num(d.average_hours) ?? 0,
      longestHours: num(d.longest_fast_hours) ?? 0,
      currentStreak: num(streak.current_streak) ?? 0,
    };
  });
}

function meditationStats(): Promise<MeditationStats> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.stats }, (value) => {
    const d = body(value);
    return { totalSessions: num(d.total_sessions) ?? 0, totalMinutes: num(d.total_minutes) ?? 0, averageMinutes: num(d.average_minutes) ?? 0 };
  });
}

/** `/meditation/home` streak — the same value as /streaks/meditation, computed with the server's rules. */
function meditationStreak(): Promise<number> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.meditation.home }, (value) => {
    const streak = body(value).streak;
    return isRecord(streak) ? num(streak.current) ?? 0 : 0;
  });
}

function energyBalance(date: string): Promise<EnergyBalance> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.energy.balance, params: { date } }, (value) => {
    const d = body(value);
    const consumption = isRecord(d.consumption) ? d.consumption : {};
    const goal = isRecord(d.goal) ? d.goal : {};
    return {
      date: str(d.date) ?? date,
      bmr: num(consumption.bmr) ?? 0,
      everydayActivity: num(consumption.everyday_activity) ?? 0,
      serverActivity: (num(consumption.sport_activity) ?? 0) + (num(consumption.manual_activity) ?? 0) + (num(consumption.imported_activity) ?? 0),
      intake: num(d.intake) ?? 0,
      calorieGoal: num(goal.calories) ?? null,
    };
  });
}

async function streaks(): Promise<{ fasting: number | null; meditation: number | null }> {
  const list = await streakApi.getStreaks();
  const find = (type: string) => list.find((s) => s.type === type)?.current ?? null;
  return { fasting: find('fasting'), meditation: find('meditation') };
}

export const insightsApi = { fastingSummary, meditationStats, meditationStreak, energyBalance, streaks };
