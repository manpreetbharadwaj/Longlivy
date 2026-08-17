import { StatisticsPeriod } from '@/features/statistics/statisticsSlice';

export function periodStartDate(period: StatisticsPeriod, now: Date = new Date()): Date {
  const d = new Date(now);
  switch (period) {
    case 'day':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'week': {
      const day = d.getDay();
      const diff = (day + 6) % 7; // Monday as start of week
      d.setDate(d.getDate() - diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'total':
    default:
      return new Date(0);
  }
}

export function isWithinPeriod(isoDate: string, period: StatisticsPeriod, now: Date = new Date()): boolean {
  const start = periodStartDate(period, now);
  return new Date(isoDate).getTime() >= start.getTime();
}

export function isWithinRange(isoDate: string, start: Date, end: Date): boolean {
  const t = new Date(isoDate).getTime();
  return t >= start.getTime() && t < end.getTime();
}

/**
 * Bounds for the period immediately preceding the current one, of the same
 * length — used for "this week vs last week" style comparisons. Returns null
 * for periods where "previous" isn't a meaningful, bounded concept (total).
 */
export function previousPeriodRange(period: StatisticsPeriod, now: Date = new Date()): { start: Date; end: Date } | null {
  const currentStart = periodStartDate(period, now);

  switch (period) {
    case 'day': {
      const start = new Date(currentStart);
      start.setDate(start.getDate() - 1);
      return { start, end: currentStart };
    }
    case 'week': {
      const start = new Date(currentStart);
      start.setDate(start.getDate() - 7);
      return { start, end: currentStart };
    }
    case 'month': {
      const start = new Date(currentStart);
      start.setMonth(start.getMonth() - 1);
      return { start, end: currentStart };
    }
    case 'year': {
      const start = new Date(currentStart);
      start.setFullYear(start.getFullYear() - 1);
      return { start, end: currentStart };
    }
    case 'total':
    default:
      return null;
  }
}

/** Percentage change from `previous` to `current`, or null if not computable. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Buckets timestamped values into whole-day totals for the last `days` days
 * (oldest first), for simple day-by-day trend bars. Missing days are
 * represented as 0 — never invented, just an honest absence of data.
 */
export function buildDailySeries<T>(
  items: T[],
  getIso: (item: T) => string,
  getValue: (item: T) => number,
  days: number,
  now: Date = new Date()
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    dayKeys.push(key);
    buckets.set(key, 0);
  }

  const earliest = new Date(cursor);
  earliest.setDate(earliest.getDate() - (days - 1));

  for (const item of items) {
    const t = new Date(getIso(item));
    if (t.getTime() < earliest.getTime()) continue;
    const key = t.toDateString();
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + getValue(item));
  }

  return dayKeys.map((key) => ({
    label: new Date(key).toLocaleDateString(undefined, { weekday: 'narrow' }),
    value: Math.round((buckets.get(key) ?? 0) * 10) / 10,
  }));
}
