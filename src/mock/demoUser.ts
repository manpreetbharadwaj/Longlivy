import { FastingMethodId } from '@/features/fasting/models';

export const DEMO_USER_ID = 'user_demo_1';

/**
 * A fictitious login credential for local mock mode only. This pair exists
 * specifically to *be* pre-filled, for a one-tap "just let me into the
 * prototype" login — used by `MockAuthRepository`'s seed, `DEMO_USER.email`
 * and `LoginScreen`'s initial field values. Never put a real address here:
 * everything in this file ships in the app bundle.
 */
export const DEMO_LOGIN_EMAIL = 'demo@longlivy.app';
export const DEMO_LOGIN_PASSWORD = 'demo1234';

export interface DemoUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'diverse';
  heightCm: number;
  weightKg: number;
  address?: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  /** Sessions per week of deliberate exercise, distinct from `activityLevel`'s overall daily-movement tier. */
  trainingFrequency?: number;
  trainingVolume?: 'low' | 'moderate' | 'high';
  goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain';
  /** 'user' once chosen in onboarding or Edit profile; 'inferred' when restored from the server's calorie target; absent = default. */
  goalSource?: 'user' | 'inferred';
  /** Only meaningful for a weight_loss/muscle_gain goal — how fast, not just which direction. */
  weightChangePaceKgPerWeek?: number;
  /** The fasting rhythm chosen as a preference during onboarding — not an active plan or an in-progress fast, both of which live in the Fasting feature's own state. */
  fastingMethod?: FastingMethodId;
  /** Nutrient ids the user chose to prioritize on MicronutrientSetupScreen — see `MICRONUTRIENTS` in `features/onboarding/data/micronutrients.ts` for the catalog. */
  micronutrientFocus?: string[];
  /**
   * Chosen profile avatar — a stable id, never an asset path, so it
   * survives rebuilds. `'initial'` or absent renders the first-letter
   * fallback; an `avatar_*` id maps to a bundled vector in
   * `features/profile/avatars`. An unknown id also falls back to the
   * initial, so retiring a preset in a later build is safe. Persisted via
   * `updateProfile` like every other field here.
   */
  avatarId?: string;
}

export const DEMO_USER: DemoUserProfile = {
  id: DEMO_USER_ID,
  firstName: 'Alex',
  lastName: 'Rivera',
  email: DEMO_LOGIN_EMAIL,
  dateOfBirth: '1992-04-18',
  gender: 'diverse',
  heightCm: 176,
  weightKg: 78.4,
  // A placeholder, obviously-fake shipping address — not the real user's —
  // so the one-tap demo login lands straight in the app instead of
  // stopping at AddressStepScreen (RootNavigator gates `Main` on a
  // non-empty address; see selectHasAddress).
  address: '123 Demo Street, Sample City, 00000',
  activityLevel: 'moderate',
  goal: 'weight_loss',
};
