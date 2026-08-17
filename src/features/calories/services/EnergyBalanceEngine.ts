import { DailyEnergyBalance } from '../models';

export const ENERGY_BALANCE_CALCULATION_VERSION = '1.0';

export interface EnergyBalanceInput {
  date: string;
  userId: string;
  calorieGoal: number;
  caloriesConsumed: number;
  bmr: number;
  activityCalories: number;
  otherExpenditure?: number;
}

/**
 * Pure calculation — the daily balance must be fully recalculable at any
 * time from its inputs, per the requirement. Never store an "already
 * computed" balance as independent truth without also keeping the inputs.
 */
export function calculateDailyEnergyBalance(input: EnergyBalanceInput): DailyEnergyBalance {
  const otherExpenditure = input.otherExpenditure ?? 0;
  const totalExpenditure = input.bmr + input.activityCalories + otherExpenditure;
  const exceeded = input.caloriesConsumed > input.calorieGoal;

  return {
    date: input.date,
    userId: input.userId,
    calorieGoal: input.calorieGoal,
    caloriesConsumed: input.caloriesConsumed,
    bmr: input.bmr,
    activityCalories: input.activityCalories,
    otherExpenditure,
    totalExpenditure,
    balance: input.caloriesConsumed - totalExpenditure,
    remaining: exceeded ? 0 : input.calorieGoal - input.caloriesConsumed,
    exceededBy: exceeded ? input.caloriesConsumed - input.calorieGoal : 0,
    calculationVersion: ENERGY_BALANCE_CALCULATION_VERSION,
  };
}
