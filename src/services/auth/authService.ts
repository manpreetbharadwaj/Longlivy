import { authApi, AuthApiSession } from '@/services/api/authApi';
import { tokenStorage } from './tokenStorage';
import { clearCalorieRepository } from '@/features/calories/repository';

/** Persists the access token returned by the documented auth endpoints. */
async function loginAndPersist(session: AuthApiSession): Promise<AuthApiSession> {
  await tokenStorage.saveTokens(session.tokens);
  const { id, email, firstName, lastName, emailVerified } = session.user;
  await tokenStorage.saveUser({ id, email, firstName, lastName, emailVerified });
  return session;
}

/**
 * Revokes the token server-side (POST /auth/logout), then always clears it
 * locally — an offline or already-expired session must still be able to sign
 * out. `logoutThunk` clears the Redux session after this completes.
 */
async function logout(): Promise<void> {
  try {
    if (await tokenStorage.getAccessToken()) await authApi.logout();
  } catch {
    // Server revocation is best-effort; the local token is removed regardless.
  } finally {
    await tokenStorage.clearTokens();
    await clearCalorieRepository();
  }
}

/** Called by the API client after a protected request receives 401. */
async function expireLocalSession(): Promise<void> {
  await tokenStorage.clearTokens();
  await clearCalorieRepository();
  const { store } = await import('@/store/store');
  const { markSessionExpired } = await import('@/features/auth/authSlice');
  store.dispatch(markSessionExpired());
}

export const authService = { loginAndPersist, logout, expireLocalSession };
