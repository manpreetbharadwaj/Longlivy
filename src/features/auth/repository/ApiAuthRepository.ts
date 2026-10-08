import { AuthRepository } from './AuthRepository';
import { AuthSession, AuthUser, RegisterInput } from '../models';
import { authApi, AuthApiSession, AuthApiUser } from '@/services/api/authApi';
import { authService } from '@/services/auth/authService';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { LocalStore } from '@/services/storage/LocalStore';
import { isNormalizedApiError } from '@/utils/apiError';

/**
 * Real-backend implementation of `AuthRepository` — satisfies the exact
 * same interface `MockAuthRepository` does, so nothing above the
 * repository layer (authSlice, screens) needs to change. See
 * `repository/index.ts` for how the active implementation is chosen, and
 * API_MIGRATION.md for the general pattern this follows.
 */

function toAuthUser(user: AuthApiUser): AuthUser {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };
}

function toSession(user: AuthApiUser, token: string): AuthSession {
  const { dateOfBirth, gender, heightCm, weightKg, address, activityLevel } = user.profile;
  return {
    user: toAuthUser(user),
    token,
    createdAt: new Date().toISOString(),
    serverProfile: { dateOfBirth, gender, heightCm, weightKg, address, activityLevel },
  };
}

function fromApiSession(apiSession: AuthApiSession): AuthSession {
  return toSession(apiSession.user, apiSession.tokens.accessToken);
}

// Onboarding-complete is a device preference rather than account data — it
// survives independently of which backend (mock or real) is active.
const onboardingStore = new LocalStore<{ complete: boolean }>('@longlivy/onboarding_complete', { complete: false });

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const session = await authApi.login({ email, password });
    await authService.loginAndPersist(session);
    return fromApiSession(session);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const session = await authApi.register(input);
    await authService.loginAndPersist(session);
    return fromApiSession(session);
  }

  async logout(): Promise<void> {
    await authService.logout();
  }

  /**
   * Validates the stored token with GET /auth/me. A rejected token clears the
   * session (the 401 interceptor already wiped storage); a network failure
   * falls back to the stored identity so the app still opens offline, and the
   * next successful protected request re-validates it.
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    const [accessToken, storedUser] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getUser()]);
    if (!accessToken) return null;
    try {
      const user = await authApi.me();
      await authService.loginAndPersist({ user, tokens: { accessToken } });
      return toSession(user, accessToken);
    } catch (error) {
      const offline = isNormalizedApiError(error) && (error.kind === 'network' || error.kind === 'timeout' || error.kind === 'server');
      if (offline && storedUser) return { user: storedUser, token: accessToken, createdAt: new Date().toISOString() };
      await tokenStorage.clearTokens();
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
