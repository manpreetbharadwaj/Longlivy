export type EnergyExpenditureType = 'bmr' | 'nrla' | 'activity' | 'imported_activity' | 'manual' | 'total_estimated';
export type EnergySource = 'device_imported' | 'longlivy_calculated' | 'user_manual';

export interface EnergyExpenditure {
  id: string;
  userId: string;
  date: string; // ISO date
  type: EnergyExpenditureType;
  calories: number;
  source: EnergySource;
  calculationMethod?: string;
  calculationVersion?: string;
  sourceId?: string;
  createdAt: string;
}

export interface DailyEnergyBalance {
  date: string;
  userId: string;
  calorieGoal: number;
  caloriesConsumed: number;
  bmr: number;
  activityCalories: number;
  otherExpenditure: number;
  totalExpenditure: number;
  balance: number; // consumed - totalExpenditure
  remaining: number; // goal - consumed, 0 if exceeded
  exceededBy: number;
  calculationVersion: string;
}

export interface BodyProfile {
  age: number;
  gender: 'female' | 'male' | 'diverse';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}
