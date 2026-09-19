import { AuthRepository } from './AuthRepository';
import { AuthSession, RegisterInput } from '../models';
import { authApi, AuthApiSession } from '@/services/api/authApi';
import { userApi } from '@/services/api/userApi';
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
// active. If the backend later wants to own this (e.g. as a field on the
// user record from GET /users/me), read/write it there instead.
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
    const accessToken = await tokenStorage.getAccessToken();
    if (!accessToken) return null;

    try {
      // If the access token is expired, this 401s and apiClient's interceptor
      // transparently refreshes and retries it — by the time this either
      // resolves or throws, the refresh flow has already run its course.
      const user = await userApi.getCurrentUser();
      return { user, token: accessToken, createdAt: new Date().toISOString() };
    } catch {
      return null;
    }
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
