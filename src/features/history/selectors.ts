import { createSelector } from '@reduxjs/toolkit';
import type { TranslationKey, TranslationParams } from '@/localization';
import { RootState } from '@/store/store';
import { selectFastingHistory } from '@/features/fasting/selectors';
import { selectActivityHistory } from '@/features/activity/selectors';
import { selectMeditationHistory } from '@/features/meditation/selectors';
import { selectWeightHistory } from '@/features/weight/selectors';
import { selectTodayMeals } from '@/features/nutrition/selectors';
import { HistoryItem } from './models';
import { activityTypeLabel } from '@/features/activity/models';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { sessionModelLabel } from '@/features/fasting/services/fastingPlanSchedule';
import { fastingStatusLabel } from '@/features/fasting/services/fastingFormat';
import { sessionStatusLabel } from '@/features/meditation/models';
import { weightSourceLabel } from '@/features/weight/models';

type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

export const selectHistoryActiveFilters = (state: RootState) => state.history.activeFilters;

/**
 * Returns a function of `t` rather than a plain array — `createSelector`
 * can't take the live `t` as a memoized input (it isn't state), so the
 * i18n-dependent title/subtitle strings are built just outside the memo
 * boundary instead. Still only rebuilds when the underlying history/filters
 * actually change, since the returned function is what's memoized.
 */
export const selectUnifiedHistory = createSelector(
  selectFastingHistory,
  selectActivityHistory,
  selectMeditationHistory,
  selectWeightHistory,
  selectTodayMeals,
  selectHistoryActiveFilters,
  (fasting, activity, meditation, weight, meals, filters) =>
    (t: TFunction): HistoryItem[] => {
      const items: HistoryItem[] = [];

      if (filters.includes('fasting')) {
        fasting.forEach((f) =>
          items.push({
            id: `h_fast_${f.id}`,
            category: 'fasting',
            title: t('history.fastTitle', { model: sessionModelLabel(f, t) }),
            subtitle: `${fastingStatusLabel(f.status, t)} · ${formatDurationHM(f.actualDuration ?? f.plannedDuration)}`,
            timestamp: f.startTimestamp,
            refId: f.id,
          })
        );
      }
      if (filters.includes('activity')) {
        activity.forEach((a) =>
          items.push({
            id: `h_act_${a.id}`,
            category: 'activity',
            title: activityTypeLabel(a.type, t),
            subtitle: a.calories
              ? t('history.activityDurationCalories', { minutes: Math.round(a.activeDuration / 60000), calories: a.calories })
              : t('history.activityDuration', { minutes: Math.round(a.activeDuration / 60000) }),
            timestamp: a.startTimestamp,
            refId: a.id,
          })
        );
      }
      if (filters.includes('meditation')) {
        meditation.forEach((m) =>
          items.push({
            id: `h_med_${m.id}`,
            category: 'meditation',
            title: m.meditationTitle,
            subtitle: t('history.meditationDurationStatus', {
              minutes: Math.round(m.activeDurationSeconds / 60),
              status: sessionStatusLabel(m.status, t),
            }),
            timestamp: m.startedAt,
            refId: m.id,
          })
        );
      }
      if (filters.includes('weight')) {
        weight.forEach((w) =>
          items.push({
            id: `h_weight_${w.id}`,
            category: 'weight',
            title: `${w.weightKg.toFixed(1)} kg`,
            subtitle: t('history.weightSource', { source: weightSourceLabel(w.source, t) }),
            timestamp: w.timestamp,
            refId: w.id,
          })
        );
      }
      if (filters.includes('nutrition')) {
        meals.forEach((m) =>
          items.push({
            id: `h_meal_${m.id}`,
            category: 'nutrition',
            title: m.name,
            subtitle: `${Math.round(m.totalCalories)} kcal`,
            timestamp: m.timestamp,
            refId: m.id,
          })
        );
      }

      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
);
