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
  // Not the demo user's goal: a neutral default until the user picks one
  // (or it's restored from their server targets).
  goal: 'maintenance',
  goalSource: undefined,
};

const store = new LocalStore<DemoUserProfile>(env.useMockApi ? '@longlivy/profile' : '@longlivy/profile/api', env.useMockApi ? DEMO_USER : API_PROFILE_DEFAULT);

export const profileRepository = {
  get: (): Promise<DemoUserProfile> => store.read(),
  save: (profile: DemoUserProfile): Promise<void> => store.write(profile),
};
