import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { selectFastingHistory } from '@/features/fasting/selectors';
import { selectActivityHistory } from '@/features/activity/selectors';
import { selectMeditationHistory } from '@/features/meditation/selectors';
import { selectWeightHistory } from '@/features/weight/selectors';
import { isWithinPeriod, isWithinRange, previousPeriodRange, percentChange, buildDailySeries } from '@/utils/date/period';

export const selectStatisticsPeriod = (state: RootState) => state.statistics.period;

/** Generic "sum of a value over the previous equivalent period" helper, shared by every domain below. */
function previousPeriodTotal<T>(
  history: T[],
  period: ReturnType<typeof selectStatisticsPeriod>,
  getIso: (item: T) => string,
  getValue: (item: T) => number
): number | null {
  const range = previousPeriodRange(period);
  if (!range) return null;
  return history.filter((item) => isWithinRange(getIso(item), range.start, range.end)).reduce((sum, item) => sum + getValue(item), 0);
}

export const selectFastingStatisticsForPeriod = createSelector(
  selectFastingHistory,
  selectStatisticsPeriod,
  (history, period) => {
    const inPeriod = history.filter((h) => isWithinPeriod(h.startTimestamp, period));
    const completed = inPeriod.filter((h) => h.status === 'completed');
    const totalHours = completed.reduce((s, h) => s + (h.actualDuration ?? 0), 0) / (1000 * 60 * 60);
    const prevHoursMs = previousPeriodTotal(
      history.filter((h) => h.status === 'completed'),
      period,
      (h) => h.startTimestamp,
      (h) => h.actualDuration ?? 0
    );
    const trend = prevHoursMs === null ? null : percentChange(totalHours, prevHoursMs / (1000 * 60 * 60));
    const dailySeries = buildDailySeries(completed, (h) => h.startTimestamp, (h) => (h.actualDuration ?? 0) / (1000 * 60 * 60), 7);

    return {
      sessionCount: inPeriod.length,
      completedCount: completed.length,
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: completed.length ? Math.round((totalHours / completed.length) * 10) / 10 : 0,
      hasData: inPeriod.length > 0,
      trend,
      dailySeries,
    };
  }
);

export const selectActivityStatisticsForPeriod = createSelector(
  selectActivityHistory,
  selectStatisticsPeriod,
  (history, period) => {
    const inPeriod = history.filter((h) => isWithinPeriod(h.startTimestamp, period));
    const totalCalories = inPeriod.reduce((s, a) => s + (a.calories ?? 0), 0);
    const prevCalories = previousPeriodTotal(history, period, (a) => a.startTimestamp, (a) => a.calories ?? 0);
    const trend = prevCalories === null ? null : percentChange(totalCalories, prevCalories);
    const dailySeries = buildDailySeries(inPeriod, (a) => a.startTimestamp, (a) => a.calories ?? 0, 7);

    return {
      activityCount: inPeriod.length,
      totalCalories,
      totalDistanceMeters: inPeriod.reduce((s, a) => s + (a.distanceMeters ?? 0), 0),
      totalDurationMs: inPeriod.reduce((s, a) => s + a.activeDuration, 0),
      hasData: inPeriod.length > 0,
      trend,
      dailySeries,
    };
  }
);

export const selectMeditationStatisticsForPeriod = createSelector(
  selectMeditationHistory,
  selectStatisticsPeriod,
  (history, period) => {
    const inPeriod = history.filter((h) => isWithinPeriod(h.startedAt, period));
    const totalSeconds = inPeriod.reduce((s, m) => s + m.activeDurationSeconds, 0);
    const prevSeconds = previousPeriodTotal(history, period, (m) => m.startedAt, (m) => m.activeDurationSeconds);
    const trend = prevSeconds === null ? null : percentChange(totalSeconds, prevSeconds);
    const dailySeries = buildDailySeries(inPeriod, (m) => m.startedAt, (m) => m.activeDurationSeconds / 60, 7);

    return {
      sessionCount: inPeriod.length,
      totalMinutes: Math.round(totalSeconds / 60),
      averageMinutes: inPeriod.length ? Math.round(totalSeconds / 60 / inPeriod.length) : 0,
      hasData: inPeriod.length > 0,
      trend,
      dailySeries,
    };
  }
);

export const selectWeightStatisticsForPeriod = createSelector(
  selectWeightHistory,
  selectStatisticsPeriod,
  (history, period) => {
    const inPeriod = history.filter((h) => isWithinPeriod(h.timestamp, period));
    if (inPeriod.length === 0) return { hasData: false, change: 0, latest: null as number | null, dailySeries: [] as { label: string; value: number }[] };
    const change = Math.round((inPeriod[inPeriod.length - 1].weightKg - inPeriod[0].weightKg) * 10) / 10;
    const dailySeries = buildDailySeries(inPeriod, (w) => w.timestamp, (w) => w.weightKg, 7).map((point, idx, arr) => ({
      // A weight chart reads better as "latest known value that day" than a sum, since it's not additive.
      ...point,
      value: point.value || arr.slice(0, idx + 1).reverse().find((p) => p.value)?.value || 0,
    }));
    return { hasData: true, change, latest: inPeriod[inPeriod.length - 1].weightKg, dailySeries };
  }
);
