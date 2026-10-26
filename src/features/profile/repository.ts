import { LocalStore } from '@/services/storage/LocalStore';
import { DemoUserProfile, DEMO_USER } from '@/mock/demoUser';
import { env } from '@/config/env';

/**
 * `profileSlice` was previously pure in-memory Redux state — correct for a
 * session, but it reset to `DEMO_USER` (address included) on every fresh
 * app launch, which meant RootNavigator's `hasAddress` gate could never
 * stay satisfied across a restart even after a real user filled it in.
 * Every other feature slice already persists through a `LocalStore`-backed
 * repository (see `MockAuthRepository`, `MockWeightRepository`, …) — this
 * gives `profile` the same treatment.
 */
/** The blank profile a newly signed-in API user starts from (no demo values carry over). */
export const API_PROFILE_DEFAULT: DemoUserProfile = {
  ...DEMO_USER,
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  address: undefined,
  // Body data comes only from the server; until then it is "Not set", never the demo values.
  dateOfBirth: undefined,
  gender: undefined,
  heightCm: undefined,
  weightKg: undefined,
  // Not the demo user's goal: a neutral default until the user picks one
  // (or it's restored from their server targets).
  goal: 'maintenance',
  goalSource: undefined,
};

const store = new LocalStore<DemoUserProfile>(env.useMockApi ? '@longlivy/profile' : '@longlivy/profile/api', env.useMockApi ? DEMO_USER : API_PROFILE_DEFAULT);

/**
 * Signed-out profiles saved before 2026-10-19 carried the demo body values
 * (they were spread into API_PROFILE_DEFAULT) and would show up as a real
 * account's height/weight. Only that exact blank-plus-demo combination is
 * cleared — a profile with an id, or with any other value, is left alone.
 */
function withoutLegacyDemoBody(profile: DemoUserProfile): DemoUserProfile {
  if (env.useMockApi || profile.id) return profile;
  const isDemo =
    profile.dateOfBirth === DEMO_USER.dateOfBirth &&
    profile.gender === DEMO_USER.gender &&
    profile.heightCm === DEMO_USER.heightCm &&
    profile.weightKg === DEMO_USER.weightKg;
  return isDemo ? { ...profile, dateOfBirth: undefined, gender: undefined, heightCm: undefined, weightKg: undefined } : profile;
}

export const profileRepository = {
  get: async (): Promise<DemoUserProfile> => withoutLegacyDemoBody(await store.read()),
  save: (profile: DemoUserProfile): Promise<void> => store.write(profile),
};
