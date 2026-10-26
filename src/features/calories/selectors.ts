import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { CalorieCalculationEngine } from './services/CalorieCalculationEngine';
import { calculateDailyEnergyBalance } from './services/EnergyBalanceEngine';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectCurrentUserId } from '@/features/auth/selectors';
import { env } from '@/config/env';

const engine = new CalorieCalculationEngine();

export const selectCalorieGoal = (state: RootState) => state.calorie.calorieGoal;
export const selectBodyProfile = (state: RootState) => state.calorie.bodyProfile;
export const selectCalorieGoalSource = (state: RootState) => state.calorie.calorieGoalSource;

/**
 * API mode: whether the account has a daily calorie goal on the server — a
 * calculated/edited `nutrition_calories` target, or a goal on today's energy
 * balance. Until the server has answered it counts as set, so the empty state
 * never flashes during loading. When false, screens show "Set your daily goal"
 * instead of numbers built from the app's built-in 2200 kcal default.
 */
export const selectHasCalorieGoal = (state: RootState): boolean => {
  if (env.useMockApi) return true;
  if (state.nutrition.serverTargets.calories) return true;
  const energy = state.insights.energyBalance;
  return energy == null || energy.calorieGoal != null;
};

export const selectBmr = createSelector(selectBodyProfile, (profile) => engine.calculateBmr(profile));

export const selectNrla = createSelector(selectBodyProfile, (profile) => engine.calculateNrla(profile));

export const selectDailyEnergyBalance = createSelector(
  selectCalorieGoal,
  selectBmr,
  selectTodayActivityCalories,
  selectDailyNutritionTotals,
  selectCurrentUserId,
  (state: RootState) => state.insights.energyBalance,
  (calorieGoal, bmr, activityCalories, nutritionTotals, userId, server) =>
    calculateDailyEnergyBalance({
      date: new Date().toISOString(),
      userId,
      // API mode: BMR, everyday activity and the goal come from GET
      // /energy/balance (computed from the server profile and targets).
      // Intake stays derived from the loaded server meals so it updates the
      // moment a meal is logged. Activity comes from the loaded history only:
      // it already merges /activities with this device's records (uploaded
      // or not), so adding the server's activity total would count it twice.
      calorieGoal: server?.calorieGoal ?? calorieGoal,
      caloriesConsumed: nutritionTotals.calories,
      // 0 from the server means the profile lacks BMR inputs; never stand in a
      // locally computed value (it would come from placeholder body data).
      bmr: server ? server.bmr : bmr.calories,
      otherExpenditure: server?.everydayActivity,
      activityCalories,
    })
);
