import { AuthRepository } from './AuthRepository';
import { AuthSession, AuthUser, RegisterInput } from '../models';
import { authApi, AuthApiSession, AuthApiUser } from '@/services/api/authApi';
import { authService } from '@/services/auth/authService';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { LocalStore } from '@/services/storage/LocalStore';
import { isNormalizedApiError } from '@/utils/apiError';
import { profileApi, UpdateProfileInput } from '@/services/api/profileApi';

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

function toSession(user: AuthApiUser, token: string, expiresAt?: string): AuthSession {
  const { dateOfBirth, gender, heightCm, weightKg, address, activityLevel, goal, weightChangePaceKgPerWeek, trainingFrequency, trainingVolume, fastingMethod, micronutrientFocus, avatarId, language } = user.profile;
  return {
    user: toAuthUser(user),
    token,
    createdAt: new Date().toISOString(),
    expiresAt,
    serverProfile: { dateOfBirth, gender, heightCm, weightKg, address, activityLevel, goal, weightChangePaceKgPerWeek, trainingFrequency, trainingVolume, fastingMethod, micronutrientFocus, avatarId, language },
  };
}

function fromApiSession(apiSession: AuthApiSession): AuthSession {
  return toSession(apiSession.user, apiSession.tokens.accessToken, apiSession.tokens.expiresAt);
}

// Onboarding-complete is a device preference rather than account data — it
// survives independently of which backend (mock or real) is active.
const onboardingStore = new LocalStore<{ complete: boolean }>('@longlivy/onboarding_complete', { complete: false });
const pendingProfileStore = new LocalStore<Record<string, UpdateProfileInput>>('@longlivy/pending_profile_sync', {});

export async function syncProfileWithRetry(userId: string, input: UpdateProfileInput): Promise<AuthApiUser | null> {
  const pending = await pendingProfileStore.read();
  const combined = { ...(pending[userId] ?? {}), ...input };
  try {
    const user = await profileApi.updateProfile(combined);
    const remaining = { ...pending };
    delete remaining[userId];
    await pendingProfileStore.write(remaining);
    return user;
  } catch {
    await pendingProfileStore.write({ ...pending, [userId]: combined });
    return null;
  }
}

async function retryPendingProfileSync(session: AuthApiSession): Promise<AuthApiSession> {
  const pending = await pendingProfileStore.read();
  const input = pending[session.user.id];
  if (!input) return session;
  const user = await syncProfileWithRetry(session.user.id, input);
  if (!user) return session;
  const updated = { ...session, user };
  await authService.loginAndPersist(updated);
  return updated;
}

export class ApiAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    let session = await authApi.login({ email, password });
    await authService.loginAndPersist(session);
    session = await retryPendingProfileSync(session);
    return fromApiSession(session);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    let session = await authApi.register(input);
    await authService.loginAndPersist(session);
    const profile: UpdateProfileInput = {
      goal: input.goal,
      weightChangePaceKgPerWeek: input.weightChangePaceKgPerWeek,
      trainingFrequency: input.trainingFrequency,
      trainingVolume: input.trainingVolume,
      fastingMethod: input.fastingMethod,
      micronutrientFocus: input.micronutrientFocus,
      avatarId: input.avatarId,
      language: input.language,
    };
    if (Object.values(profile).some((value) => value !== undefined)) {
      // Registration has already succeeded, so a transient follow-up profile
      // failure must not make the user retry registration and hit duplicate-email.
      const user = await syncProfileWithRetry(session.user.id, profile);
      if (user) {
        session = { ...session, user };
        await authService.loginAndPersist(session);
      } else {
        // The account is valid and usable. The exact write is retried after
        // the next successful login/bootstrap; no mock value is substituted.
      }
    }
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
    const [accessToken, expiresAt, storedUser] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getExpiresAt(), tokenStorage.getUser()]);
    if (!accessToken) return null;
    try {
      let user = await authApi.me();
      // expiresAt is present for every session issued under the current
      // contract. A legacy token without it is still server-revalidated.
      const effectiveExpiry = expiresAt ?? new Date(Date.now() + 30 * 86_400_000).toISOString();
      await authService.loginAndPersist({ user, tokens: { accessToken, expiresAt: effectiveExpiry } });
      ({ user } = await retryPendingProfileSync({ user, tokens: { accessToken, expiresAt: effectiveExpiry } }));
      return toSession(user, accessToken, effectiveExpiry);
    } catch (error) {
      const offline = isNormalizedApiError(error) && (error.kind === 'network' || error.kind === 'timeout' || error.kind === 'server');
      if (offline && storedUser) return { user: storedUser, token: accessToken, createdAt: new Date().toISOString(), expiresAt: expiresAt ?? undefined };
      await tokenStorage.clearTokens();
      return null;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    await authApi.requestPasswordReset(email);
  }

  async confirmPasswordReset(input: { email: string; code: string; password: string }): Promise<void> {
    await authApi.resetPassword(input);
  }

  async resendVerificationEmail(): Promise<void> {
    await authApi.resendVerificationEmail();
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
