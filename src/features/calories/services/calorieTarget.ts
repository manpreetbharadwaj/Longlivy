import { BodyProfile } from '../models';
import { CalorieCalculationEngine } from './CalorieCalculationEngine';

export type PersonalGoal = 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain';

const engine = new CalorieCalculationEngine();

/** The daily target the engine derives from a body profile and a goal - the one place the profile screen and onboarding agree on how a target is produced. */
export function calculateAutoCalorieTarget(body: BodyProfile, goal: PersonalGoal, paceKgPerWeek?: number | null) {
  const bmr = engine.calculateBmr(body);
  const nrla = engine.calculateNrla(body);
  return { calories: engine.calculateCalorieGoal(nrla, goal, paceKgPerWeek), method: bmr.method, version: bmr.version };
}

/**
 * A weight-change pace only means something for the direction it was chosen
 * for (0.5 kg/week of loss says nothing about gain), so it survives an edit
 * that keeps the same goal and is cleared by one that changes it - the target
 * then falls back to the engine's standard deficit/surplus.
 */
export function paceAfterGoalChange(previousGoal: PersonalGoal, nextGoal: PersonalGoal, pace: number | undefined): number | undefined {
  return nextGoal === previousGoal ? pace : undefined;
}
