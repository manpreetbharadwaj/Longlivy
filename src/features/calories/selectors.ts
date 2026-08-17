import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { CalorieCalculationEngine } from './services/CalorieCalculationEngine';
import { calculateDailyEnergyBalance } from './services/EnergyBalanceEngine';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { DEMO_USER } from '@/mock/demoUser';

const engine = new CalorieCalculationEngine();

export const selectCalorieGoal = (state: RootState) => state.calorie.calorieGoal;
export const selectBodyProfile = (state: RootState) => state.calorie.bodyProfile;

export const selectBmr = createSelector(selectBodyProfile, (profile) => engine.calculateBmr(profile));

export const selectNrla = createSelector(selectBodyProfile, (profile) => engine.calculateNrla(profile));

export const selectDailyEnergyBalance = createSelector(
  selectCalorieGoal,
  selectBmr,
  selectTodayActivityCalories,
  selectDailyNutritionTotals,
  (calorieGoal, bmr, activityCalories, nutritionTotals) =>
    calculateDailyEnergyBalance({
      date: new Date().toISOString(),
      userId: DEMO_USER.id,
      calorieGoal,
      caloriesConsumed: nutritionTotals.calories,
      bmr: bmr.calories,
      activityCalories,
    })
);
