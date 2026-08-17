import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';
import { calculateGoalProgress } from './services/NutritionCalculationService';

export const selectTodayMeals = (state: RootState) => state.nutrition.todayMeals;
export const selectNutritionGoals = (state: RootState) => state.nutrition.goals;
export const selectFoodSearchResults = (state: RootState) => state.nutrition.searchResults;
export const selectFoodSearchStatus = (state: RootState) => state.nutrition.searchStatus;
export const selectFavoriteFoods = (state: RootState) => state.nutrition.favorites;

export const selectDailyNutritionTotals = createSelector(selectTodayMeals, (meals) => {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.protein,
      carbohydrates: acc.carbohydrates + meal.carbohydrates,
      fat: acc.fat + meal.fat,
      fiber: acc.fiber + meal.fiber,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 }
  );
});

export const selectNutritionProgress = createSelector(
  selectDailyNutritionTotals,
  selectNutritionGoals,
  (totals, goals) => ({
    calories: calculateGoalProgress(totals.calories, goals.calories.target),
    protein: calculateGoalProgress(totals.protein, goals.protein.target),
    carbohydrates: calculateGoalProgress(totals.carbohydrates, goals.carbohydrates.target),
    fat: calculateGoalProgress(totals.fat, goals.fat.target),
    fiber: calculateGoalProgress(totals.fiber, goals.fiber.target),
  })
);
