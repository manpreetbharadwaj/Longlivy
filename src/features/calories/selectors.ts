import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { CalorieCalculationEngine } from './services/CalorieCalculationEngine';
import { calculateDailyEnergyBalance } from './services/EnergyBalanceEngine';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectCurrentUserId } from '@/features/auth/selectors';

const engine = new CalorieCalculationEngine();

export const selectCalorieGoal = (state: RootState) => state.calorie.calorieGoal;
export const selectBodyProfile = (state: RootState) => state.calorie.bodyProfile;
export const selectCalorieGoalSource = (state: RootState) => state.calorie.calorieGoalSource;

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
      // moment a meal is logged; tracked activities are added on top because
      // the server has no activity data yet.
      calorieGoal: server?.calorieGoal ?? calorieGoal,
      caloriesConsumed: nutritionTotals.calories,
      bmr: server && server.bmr > 0 ? server.bmr : bmr.calories,
      otherExpenditure: server?.everydayActivity,
      activityCalories: activityCalories + (server?.serverActivity ?? 0),
    })
);
