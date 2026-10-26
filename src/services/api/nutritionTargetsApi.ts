import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { goalsApi } from './goalsApi';
import { dataRecord, localDateKey } from './laravel';
import { NutritionGoals } from '@/features/nutrition/models';

/**
 * Daily nutrition targets are stored server-side as goals with
 * `goal_type: nutrition_calories | nutrition_protein | nutrition_carbs |
 * nutrition_fat | nutrition_fiber` (verified 2026-10-08). They are created or
 * recalculated by POST /energy/targets/calculate and edited with PUT
 * /goals/{id}; GET /energy/balance and GET /nutrition/day read them.
 */
export type NutritionTargetKey = keyof NutritionGoals;

const GOAL_TYPE: Record<NutritionTargetKey, string> = {
  calories: 'nutrition_calories',
  protein: 'nutrition_protein',
  carbohydrates: 'nutrition_carbs',
  fat: 'nutrition_fat',
  fiber: 'nutrition_fiber',
};
const UNIT: Record<NutritionTargetKey, string> = { calories: 'kcal', protein: 'g', carbohydrates: 'g', fat: 'g', fiber: 'g' };
const NAME: Record<NutritionTargetKey, string> = { calories: 'Calories', protein: 'Protein', carbohydrates: 'Carbohydrates', fat: 'Fat', fiber: 'Fiber' };
const KEYS = Object.keys(GOAL_TYPE) as NutritionTargetKey[];

export interface NutritionTarget {
  goalId: string;
  target: number;
  active: boolean;
  /** `longlivy_calculated` on the server → 'auto'. */
  source: 'auto' | 'manual';
}

export type NutritionTargets = Partial<Record<NutritionTargetKey, NutritionTarget>>;

export type TargetDirection = 'maintain' | 'lose' | 'gain';

async function list(): Promise<NutritionTargets> {
  const goals = await goalsApi.getGoals();
  const targets: NutritionTargets = {};
  for (const key of KEYS) {
    // The newest record wins if the server ever holds duplicates.
    const goal = goals.filter((g) => g.type === GOAL_TYPE[key]).pop();
    // Calculated targets carry decimals (195.45 g); the app shows whole units.
    if (goal) targets[key] = { goalId: goal.id, target: Math.round(goal.target), active: goal.active, source: goal.source === 'manual' ? 'manual' : 'auto' };
  }
  return targets;
}

/** Recomputes all five targets from the profile (Mifflin-St Jeor TDEE ± 500 kcal) and stores them as goals. */
async function calculate(direction: TargetDirection): Promise<NutritionTargets> {
  await apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.energy.calculateTargets, data: { direction } }, (body) => dataRecord(body, 'targets'));
  return list();
}

/** Edits an existing target, or creates the goal when none exists yet. */
async function save(key: NutritionTargetKey, existing: NutritionTarget | undefined, changes: { target?: number; active?: boolean }): Promise<NutritionTarget> {
  if (existing) {
    const goal = await goalsApi.updateGoal(existing.goalId, { target: changes.target, active: changes.active });
    // Editing the value switches the server's `source` to `manual` (verified 2026-10-16).
    return { goalId: goal.id, target: goal.target, active: goal.active, source: changes.target !== undefined ? 'manual' : existing.source };
  }
  const goal = await goalsApi.createGoal({
    type: GOAL_TYPE[key],
    name: NAME[key],
    target: changes.target ?? 0,
    unit: UNIT[key],
    period: 'day',
    startDate: localDateKey(),
    active: changes.active ?? true,
  });
  return { goalId: goal.id, target: goal.target, active: goal.active, source: 'manual' };
}

export const nutritionTargetsApi = { list, calculate, save };
