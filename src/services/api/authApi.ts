import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { ApiError } from '@/utils/apiError';

/** The user shape required by the existing auth repository. */
export interface AuthApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

/** The documented auth contract currently exposes an access token only. */
export interface AuthApiTokens {
  accessToken: string;
}

export interface AuthApiSession {
  user: AuthApiUser;
  tokens: AuthApiTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'diverse';
  heightCm: number;
  weightKg: number;
  address?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** Accept only common envelope variants; never cast an unverified body. */
function unwrap(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  const data = isRecord(value.data) ? value.data : value;
  return isRecord(data) ? data : (() => { throw new ApiError({ kind: 'malformed' }); })();
}

function normalizeUser(value: unknown): AuthApiUser {
  const user = unwrap(value);
  const id = nonEmptyString(user.id) ?? nonEmptyString(user.userId);
  const email = nonEmptyString(user.email);
  const firstName = nonEmptyString(user.firstName) ?? nonEmptyString(user.first_name);
  const lastName = nonEmptyString(user.lastName) ?? nonEmptyString(user.last_name);
  if (!id || !email || firstName === undefined || lastName === undefined) {
    throw new ApiError({ kind: 'malformed' });
  }

  return {
    id,
    email,
    firstName,
    lastName,
    emailVerified: user.emailVerified === true || user.email_verified === true,
  };
}

/**
 * Normalizes token/user envelopes defensively. Refresh tokens are intentionally
 * ignored because the backend contract does not define one.
 */
export function normalizeAuthSession(value: unknown): AuthApiSession {
  const body = unwrap(value);
  const tokenSource = isRecord(body.tokens) ? body.tokens : body;
  const accessToken =
    nonEmptyString(tokenSource.accessToken) ??
    nonEmptyString(tokenSource.access_token) ??
    nonEmptyString(tokenSource.token);
  if (!accessToken) throw new ApiError({ kind: 'malformed' });

  const userValue = body.user ?? body.profile ?? body.account ?? (body.id && body.email ? body : undefined);
  if (!userValue) throw new ApiError({ kind: 'malformed' });

  return {
    user: normalizeUser(userValue),
    tokens: { accessToken },
  };
}

function login(payload: LoginPayload): Promise<AuthApiSession> {
  return apiRequestParsed(
    { method: 'POST', url: API_ENDPOINTS.auth.login, data: payload, skipAuth: true },
    normalizeAuthSession,
  );
}

function register(payload: RegisterPayload): Promise<AuthApiSession> {
  return apiRequestParsed(
    {
      method: 'POST',
      url: API_ENDPOINTS.auth.register,
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        password: payload.password,
        date_of_birth: payload.dateOfBirth,
        gender: payload.gender,
        height: payload.heightCm,
        current_weight: payload.weightKg,
        ...(payload.address ? { address: payload.address } : {}),
      },
      skipAuth: true,
    },
    normalizeAuthSession,
  );
}

/**
 * Compatibility methods for the existing repository interface. No endpoint
 * is guessed for these operations until the backend documents one.
 */
function unsupportedAuthOperation(operation: string): Promise<never> {
  return Promise.reject(new ApiError({ kind: 'unknown', message: `${operation} is not supported by the documented API.` }));
}

function resetPassword(_email: string): Promise<void> {
  return unsupportedAuthOperation('Password reset') as Promise<void>;
}

function verifyEmail(_code: string): Promise<void> {
  return unsupportedAuthOperation('Email verification') as Promise<void>;
}

export const authApi = { login, register, resetPassword, verifyEmail };
