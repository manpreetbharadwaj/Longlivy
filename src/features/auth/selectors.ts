import { RootState } from '@/store/store';

/**
 * `session` is the one source of truth for "am I logged in and as whom" —
 * everything below is derived from it (or from `status`), never stored
 * separately, so there's no risk of e.g. `isAuthenticated` and `session`
 * disagreeing with each other.
 */
export const selectAuthSession = (state: RootState) => state.auth.session;
export const selectAuthUser = (state: RootState) => state.auth.session?.user ?? null;
/** Mirrors the access token currently in `session` — the authoritative, persisted copy lives in `tokenStorage` (SecureStore). */
export const selectAccessToken = (state: RootState) => state.auth.session?.token ?? null;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.session;
export const selectAuthBootstrapped = (state: RootState) => state.auth.bootstrapped;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectIsAuthLoading = (state: RootState) => state.auth.status === 'loading';
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectOnboardingComplete = (state: RootState) => state.auth.onboardingComplete;
