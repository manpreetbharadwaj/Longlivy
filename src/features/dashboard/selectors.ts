import { createSelector } from '@reduxjs/toolkit';
import { selectDailyEnergyBalance } from '@/features/calories/selectors';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories, selectTodayActivityMinutes, selectActivityStats } from '@/features/activity/selectors';
import { selectFastingStats, selectActiveFast, selectActiveFastStaticProgress } from '@/features/fasting/selectors';
import { selectTodayMeditationSeconds, selectMeditationStreak } from '@/features/meditation/selectors';
import { selectCurrentWeight, selectWeightTrend } from '@/features/weight/selectors';
import { selectActiveGoals } from '@/features/goals/selectors';
import { DailySummary, DailyRing } from './models';

/** Fallback ring targets for goal types that don't yet have an active Goal in state. */
const FALLBACK_ACTIVITY_TARGET_MINUTES = 30;
const FALLBACK_MINDFULNESS_TARGET_MINUTES = 10;

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

/**
 * One consolidated "how's today going" view across every pillar, composed
 * entirely from existing per-feature selectors (no new calculation logic).
 * Promotes what `TodaySummary` used to assemble inline so any screen can
 * subscribe to the same shape.
 */
export const selectDailySummary = createSelector(
  selectDailyEnergyBalance,
  selectDailyNutritionTotals,
  selectTodayActivityCalories,
  selectTodayActivityMinutes,
  selectActivityStats,
  selectFastingStats,
  selectActiveFast,
  selectActiveFastStaticProgress,
  selectTodayMeditationSeconds,
  selectMeditationStreak,
  selectCurrentWeight,
  selectWeightTrend,
  selectActiveGoals,
  (
    balance,
    nutritionTotals,
    activityCalories,
    activityMinutes,
    activityStats,
    fastingStats,
    activeFast,
    fastProgress,
    meditationSeconds,
    meditationStreak,
    currentWeight,
    weightTrend,
    goals
  ): DailySummary => {
    const activityTargetMinutes = goals.find((g) => g.type === 'activity_minutes')?.target ?? FALLBACK_ACTIVITY_TARGET_MINUTES;
    const mindfulnessTargetMinutes = goals.find((g) => g.type === 'meditation_minutes')?.target ?? FALLBACK_MINDFULNESS_TARGET_MINUTES;
    const meditationMinutesToday = meditationSeconds / 60;

    const rings: DailyRing[] = [
      {
        key: 'nutrition',
        label: 'Nutrition',
        value: Math.round(balance.caloriesConsumed),
        target: balance.calorieGoal,
        fraction: clampFraction(balance.calorieGoal > 0 ? balance.caloriesConsumed / balance.calorieGoal : 0),
        color: '#D6A253',
      },
      {
        key: 'activity',
        label: 'Activity',
        value: activityMinutes,
        target: activityTargetMinutes,
        fraction: clampFraction(activityTargetMinutes > 0 ? activityMinutes / activityTargetMinutes : 0),
        color: '#D98657',
      },
      {
        key: 'mindfulness',
        label: 'Mindfulness',
        value: Math.round(meditationMinutesToday),
        target: mindfulnessTargetMinutes,
        fraction: clampFraction(mindfulnessTargetMinutes > 0 ? meditationMinutesToday / mindfulnessTargetMinutes : 0),
        color: '#A186BD',
      },
    ];

    return {
      energy: {
        calorieGoal: balance.calorieGoal,
        caloriesConsumed: balance.caloriesConsumed,
        totalExpenditure: balance.totalExpenditure,
        remaining: balance.remaining,
        exceededBy: balance.exceededBy,
      },
      nutrition: {
        calories: nutritionTotals.calories,
        protein: nutritionTotals.protein,
        carbohydrates: nutritionTotals.carbohydrates,
        fat: nutritionTotals.fat,
      },
      activity: {
        caloriesBurned: activityCalories,
        minutes: activityMinutes,
        sessionsTotal: activityStats.totalActivities,
      },
      fasting: {
        isActive: !!activeFast,
        currentStreak: fastingStats.currentStreak,
        progressFraction: fastProgress ? clampFraction(fastProgress.progress) : null,
      },
      mindfulness: {
        minutesToday: meditationMinutesToday,
        streak: meditationStreak,
      },
      body: {
        weightKg: currentWeight ? currentWeight.weightKg : null,
        trendKg: weightTrend,
      },
      rings,
    };
  }
);

export const selectDailySummaryRings = createSelector(selectDailySummary, (summary) => summary.rings);
