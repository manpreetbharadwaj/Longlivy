import { Food } from '../models';

export interface ScaledNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

/**
 * Scales a Food's per-serving nutrition to an arbitrary quantity.
 * e.g. 100g = 150 kcal, user enters 250g -> 375 kcal.
 * All formulas live here — never inline this math inside a component.
 */
export function scaleNutrition(food: Food, quantity: number): ScaledNutrition {
  const factor = food.servingSize > 0 ? quantity / food.servingSize : 0;
  const round = (v: number) => Math.round(v * 10) / 10;

  return {
    calories: round(food.calories * factor),
    protein: round(food.protein * factor),
    carbohydrates: round(food.carbohydrates * factor),
    fat: round(food.fat * factor),
    fiber: food.fiber !== undefined ? round(food.fiber * factor) : undefined,
    sugar: food.sugar !== undefined ? round(food.sugar * factor) : undefined,
    sodium: food.sodium !== undefined ? round(food.sodium * factor) : undefined,
  };
}

export interface GoalProgress {
  current: number;
  target: number;
  remaining: number;
  percentage: number;
  exceeded: boolean;
  exceededBy: number;
}

/** Never report "N remaining" once a goal is exceeded — always "exceeded by N". */
export function calculateGoalProgress(current: number, target: number): GoalProgress {
  const exceeded = current > target;
  const percentage = target > 0 ? Math.min((current / target) * 100, 999) : 0;
  return {
    current,
    target,
    remaining: exceeded ? 0 : Math.max(target - current, 0),
    percentage,
    exceeded,
    exceededBy: exceeded ? current - target : 0,
  };
}
