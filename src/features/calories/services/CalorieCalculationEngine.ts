import { BodyProfile } from '../models';

/**
 * Strategy pattern for BMR calculation. A new algorithm can be added later
 * (e.g. Harris-Benedict, Katch-McArdle) by implementing this interface and
 * registering it — the rest of the app only ever talks to CalorieCalculationEngine.
 */
export interface BmrCalculationStrategy {
  readonly method: string;
  readonly version: string;
  calculate(profile: BodyProfile): number;
}

const ACTIVITY_MULTIPLIERS: Record<BodyProfile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export class MifflinStJeorStrategy implements BmrCalculationStrategy {
  readonly method = 'Mifflin-St Jeor';
  readonly version = '1.0';

  calculate(profile: BodyProfile): number {
    const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
    const genderOffset = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -78;
    return Math.round(base + genderOffset);
  }
}

export class CalorieCalculationEngine {
  constructor(private strategy: BmrCalculationStrategy = new MifflinStJeorStrategy()) {}

  calculateBmr(profile: BodyProfile): { calories: number; method: string; version: string } {
    return {
      calories: this.strategy.calculate(profile),
      method: this.strategy.method,
      version: this.strategy.version,
    };
  }

  calculateNrla(profile: BodyProfile): number {
    const bmr = this.strategy.calculate(profile);
    return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
  }

  /**
   * `paceKgPerWeek` (optional) converts a chosen weight-change pace into
   * the actual daily deficit/surplus, at ~7700 kcal per kg of body mass
   * (÷7 days/week ≈ 1100 kcal/day per kg/week): 0.5 kg/week loss → a ~550
   * kcal/day deficit. Omitted (or `goal === 'maintenance'`, where pace
   * isn't meaningful) falls back to the original fixed ±500/+300 estimate.
   */
  calculateCalorieGoal(nrla: number, goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain', paceKgPerWeek?: number | null): number {
    const paceOffset = paceKgPerWeek != null ? Math.round((paceKgPerWeek * 7700) / 7) : null;
    switch (goal) {
      case 'weight_loss':
        return Math.round(nrla - (paceOffset ?? 500));
      case 'muscle_gain':
        return Math.round(nrla + (paceOffset ?? 300));
      default:
        return Math.round(nrla);
    }
  }
}
