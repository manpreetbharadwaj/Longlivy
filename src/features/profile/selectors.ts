import { RootState } from '@/store/store';

export const selectUserProfile = (state: RootState) => state.profile.profile;
/** Gates `Main` in RootNavigator — a non-empty address (collected on AddressStepScreen, right after registration) is required before the app is considered fully set up, per the Longlivy webshop's needs. */
export const selectHasAddress = (state: RootState) => !!state.profile.profile.address?.trim();
/** True once the persisted profile has been read back in on this launch — see `hydrateProfileThunk`. */
export const selectProfileHydrated = (state: RootState) => state.profile.hydrated;
