import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { selectFastingHistory } from '@/features/fasting/selectors';
import { selectActivityHistory } from '@/features/activity/selectors';
import { selectMeditationHistory } from '@/features/meditation/selectors';
import { selectWeightHistory } from '@/features/weight/selectors';
import { selectTodayMeals } from '@/features/nutrition/selectors';
import { HistoryItem } from './models';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

export const selectHistoryActiveFilters = (state: RootState) => state.history.activeFilters;

export const selectUnifiedHistory = createSelector(
  selectFastingHistory,
  selectActivityHistory,
  selectMeditationHistory,
  selectWeightHistory,
  selectTodayMeals,
  selectHistoryActiveFilters,
  (fasting, activity, meditation, weight, meals, filters): HistoryItem[] => {
    const items: HistoryItem[] = [];

    if (filters.includes('fasting')) {
      fasting.forEach((f) =>
        items.push({
          id: `h_fast_${f.id}`,
          category: 'fasting',
          title: `${f.method} fast`,
          subtitle: `${f.status.replace('_', ' ')} · ${formatDurationHM(f.actualDuration ?? f.plannedDuration)}`,
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
          title: ACTIVITY_TYPE_LABELS[a.type],
          subtitle: `${Math.round(a.activeDuration / 60000)} min${a.calories ? ` · ${a.calories} kcal` : ''}`,
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
          subtitle: `${Math.round(m.activeDurationSeconds / 60)} min · ${m.status.replace('_', ' ')}`,
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
          subtitle: `Source: ${w.source.replace('_', ' ')}`,
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
