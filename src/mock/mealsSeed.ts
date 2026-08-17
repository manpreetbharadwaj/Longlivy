import { Meal } from '@/features/nutrition/models';
import { DEMO_USER_ID } from './demoUser';

function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MEALS_SEED: Meal[] = [
  {
    id: 'meal_breakfast_today',
    userId: DEMO_USER_ID,
    mealType: 'breakfast',
    timestamp: todayAt(8, 15),
    name: 'Breakfast',
    totalCalories: 452,
    protein: 28,
    carbohydrates: 46,
    fat: 16,
    fiber: 9,
    sodium: 180,
    createdAt: todayAt(8, 15),
    items: [
      { id: 'mi_1', mealId: 'meal_breakfast_today', foodId: 'food_egg', foodName: 'Egg, whole', quantity: 100, unit: 'g', calories: 156, protein: 12.6, carbohydrates: 1.2, fat: 10.6 },
      { id: 'mi_2', mealId: 'meal_breakfast_today', foodId: 'food_skyr', foodName: 'Skyr', quantity: 200, unit: 'g', calories: 126, protein: 22, carbohydrates: 8, fat: 0.4 },
      { id: 'mi_3', mealId: 'meal_breakfast_today', foodId: 'food_berries', foodName: 'Mixed Berries', quantity: 100, unit: 'g', calories: 43, protein: 0.7, carbohydrates: 9.6, fat: 0.4 },
    ],
  },
  {
    id: 'meal_lunch_today',
    userId: DEMO_USER_ID,
    mealType: 'lunch',
    timestamp: todayAt(13, 0),
    name: 'Lunch',
    totalCalories: 612,
    protein: 55,
    carbohydrates: 58,
    fat: 18,
    fiber: 5,
    sodium: 320,
    createdAt: todayAt(13, 0),
    items: [
      { id: 'mi_4', mealId: 'meal_lunch_today', foodId: 'food_chicken_breast', foodName: 'Chicken Breast, cooked', quantity: 200, unit: 'g', calories: 330, protein: 62, carbohydrates: 0, fat: 7.2 },
      { id: 'mi_5', mealId: 'meal_lunch_today', foodId: 'food_rice_cooked', foodName: 'White Rice, cooked', quantity: 150, unit: 'g', calories: 195, protein: 4, carbohydrates: 42, fat: 0.45 },
    ],
  },
];
