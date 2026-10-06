import { AuthApiSession } from '@/services/api/authApi';
import { tokenStorage } from './tokenStorage';

/** Persists the access token returned by the documented auth endpoints. */
async function loginAndPersist(session: AuthApiSession): Promise<AuthApiSession> {
  await tokenStorage.saveTokens(session.tokens);
  await tokenStorage.saveUser(session.user);
  return session;
}

/**
 * Local logout only. The backend contract defines no logout endpoint, so this
 * clears the local bearer token and never invents a network protocol.
 * `logoutThunk` clears the Redux session after the repository call completes.
 */
async function logout(): Promise<void> {
  await tokenStorage.clearTokens();
}

/** Called by the API client after a protected request receives 401. */
async function expireLocalSession(): Promise<void> {
  await tokenStorage.clearTokens();
  const { store } = await import('@/store/store');
  const { markSessionExpired } = await import('@/features/auth/authSlice');
  store.dispatch(markSessionExpired());
}

export const authService = { loginAndPersist, logout, expireLocalSession };
