import { AuthRepository } from './AuthRepository';
import { AuthSession, RegisterInput } from '../models';
import { authApi, AuthApiSession } from '@/services/api/authApi';
import { authService } from '@/services/auth/authService';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { LocalStore } from '@/services/storage/LocalStore';

/**
 * Real-backend implementation of `AuthRepository` — satisfies the exact
 * same interface `MockAuthRepository` does, so nothing above the
 * repository layer (authSlice, screens) needs to change. See
 * `repository/index.ts` for how the active implementation is chosen, and
 * API_MIGRATION.md for the general pattern this follows.
 */

function toAuthSession(apiSession: AuthApiSession): AuthSession {
  return {
    user: apiSession.user,
    token: apiSession.tokens.accessToken,
    createdAt: new Date().toISOString(),
  };
}

// Onboarding-complete is treated as a device preference rather than account
// data — it survives independently of which backend (mock or real) is
// active. The documented API has no profile update/read contract beyond the
// credentialed POST /me operation, so it remains device-scoped for now.
const onboardingStore = new LocalStore<{ complete: boolean }>('@longlivy/onboarding_complete', { complete: false });

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const session = await authApi.login({ email, password });
    await authService.loginAndPersist(session);
    return toAuthSession(session);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const session = await authApi.register(input);
    await authService.loginAndPersist(session);
    return toAuthSession(session);
  }

  async logout(): Promise<void> {
    await authService.logout();
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const [accessToken, user] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getUser()]);
    // The documented /me endpoint requires email/password, so it is not safe
    // to call it during startup with a password that was never persisted. A
    // stored user snapshot restores the session locally; the first protected
    // request validates the token and the 401 interceptor signs out if needed.
    if (!accessToken || !user) return null;
    return { user, token: accessToken, createdAt: new Date().toISOString() };
  }

  async resetPassword(email: string): Promise<void> {
    await authApi.resetPassword(email);
  }

  async verifyEmail(code: string): Promise<void> {
    await authApi.verifyEmail(code);
  }

  async getOnboardingComplete(): Promise<boolean> {
    const { complete } = await onboardingStore.read();
    return complete;
  }

  async setOnboardingComplete(value: boolean): Promise<void> {
    await onboardingStore.write({ complete: value });
  }
}

export const apiAuthRepository: AuthRepository = new ApiAuthRepository();
