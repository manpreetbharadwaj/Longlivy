import { LocalStore } from '@/services/storage/LocalStore';
import { DemoUserProfile, DEMO_USER } from '@/mock/demoUser';

/**
 * `profileSlice` was previously pure in-memory Redux state — correct for a
 * session, but it reset to `DEMO_USER` (address included) on every fresh
 * app launch, which meant RootNavigator's `hasAddress` gate could never
 * stay satisfied across a restart even after a real user filled it in.
 * Every other feature slice already persists through a `LocalStore`-backed
 * repository (see `MockAuthRepository`, `MockWeightRepository`, …) — this
 * gives `profile` the same treatment.
 */
const store = new LocalStore<DemoUserProfile>('@longlivy/profile', DEMO_USER);

export const profileRepository = {
  get: (): Promise<DemoUserProfile> => store.read(),
  save: (profile: DemoUserProfile): Promise<void> => store.write(profile),
};
