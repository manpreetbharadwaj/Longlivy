import { LocalStore } from '@/services/storage/LocalStore';
import type { CalorieState } from './calorieSlice';

/**
 * The calorie target and the body profile it was derived from were held in
 * memory only, so a target changed by the user (or computed at onboarding)
 * fell back to the built-in default on the next launch. This persists that
 * state the same way the profile is persisted.
 */
let store: LocalStore<CalorieState> | null = null;

export function createCalorieRepository(defaultState: CalorieState) {
  store = new LocalStore<CalorieState>('@longlivy/calorie', defaultState);
  return {
    get: (): Promise<CalorieState> => store!.read(),
    save: (state: CalorieState): Promise<void> => store!.write(state),
  };
}

/** Drops the persisted calorie state (target + body profile) — called when a session ends. */
export async function clearCalorieRepository(): Promise<void> {
  await store?.clear();
}
