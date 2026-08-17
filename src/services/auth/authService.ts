import { authApi, AuthApiSession } from '@/services/api/authApi';
import { tokenStorage } from './tokenStorage';

/**
 * The single place that knows what "being logged in" means end to end:
 * persisting tokens, refreshing them, and tearing everything down on
 * logout. `apiClient`'s 401 handler and `ApiAuthRepository` both call into
 * this instead of duplicating the logic themselves.
 *
 * Redux is imported lazily (dynamic `import()`) inside the functions that
 * need it, not at module load time — `authSlice` -> the auth repository ->
 * `ApiAuthRepository` -> this file would otherwise form a circular import
 * back to the store.
 */

async function loginAndPersist(session: AuthApiSession): Promise<AuthApiSession> {
  await tokenStorage.saveTokens(session.tokens);
  return session;
}

/**
 * Called from `apiClient`'s response interceptor when a request 401s.
 * Throws (never returns) if there is no valid way to recover — the caller
 * is expected to treat a throw here as "log the user out".
 */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const tokens = await authApi.refreshToken(refreshToken);
  await tokenStorage.saveTokens(tokens);
  return tokens.accessToken;
}

/**
 * Full logout: clears persisted tokens, tells the backend (best-effort —
 * a failure here must never block the local logout), and resets Redux auth
 * state so `RootNavigator` redirects to the Auth stack. Safe to call from
 * anywhere — a screen's "Log out" button, or automatically after a failed
 * token refresh.
 */
async function logout(): Promise<void> {
  await authApi.logout().catch(() => undefined);
  await tokenStorage.clearTokens();

  const { store } = await import('@/store/store');
  const { logoutThunk } = await import('@/features/auth/authSlice');
  store.dispatch(logoutThunk());
}

export const authService = { loginAndPersist, refreshAccessToken, logout };
