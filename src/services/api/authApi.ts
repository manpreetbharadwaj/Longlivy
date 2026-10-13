import { apiRequest, apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { dataField, dataRecord, str } from './laravel';
import { ApiUser, mapApiUser } from './profileApi';
import { ApiError } from '@/utils/apiError';

/** The user shape required by the existing auth repository, plus the server profile. */
export type AuthApiUser = ApiUser;

/** Laravel Sanctum issues a single bearer token; there is no refresh token. */
export interface AuthApiTokens {
  accessToken: string;
  expiresAt: string;
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

/**
 * `{ success, message, data: { user: {..., profile}, token, token_type } }`
 * — verified against POST /auth/login and /auth/register.
 */
export function normalizeAuthSession(body: unknown): AuthApiSession {
  const accessToken = str(dataField(body, 'token'));
  const expiresAt = str(dataField(body, 'expires_at'));
  if (!accessToken || !expiresAt || !Number.isFinite(Date.parse(expiresAt))) throw new ApiError({ kind: 'malformed' });
  return { user: mapApiUser(dataRecord(body, 'user')), tokens: { accessToken, expiresAt } };
}

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function login(payload: LoginPayload): Promise<AuthApiSession> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.auth.login, data: payload, skipAuth: true }, normalizeAuthSession);
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
        // Required by the backend's `confirmed` rule; the app's form has a single password field.
        password_confirmation: payload.password,
        date_of_birth: payload.dateOfBirth,
        gender: payload.gender,
        height: payload.heightCm,
        current_weight: payload.weightKg,
        ...(payload.address ? { address: payload.address } : {}),
        // The server defaults to UTC; meal days and streaks are computed in this zone.
        ...(deviceTimeZone() ? { timezone: deviceTimeZone() } : {}),
      },
      skipAuth: true,
    },
    normalizeAuthSession,
  );
}

/** GET /auth/me — validates the stored token and returns the current user. */
function me(): Promise<AuthApiUser> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.auth.me }, (body) => mapApiUser(dataRecord(body, 'user')));
}

/** POST /auth/logout — revokes the current token server-side (verified: /auth/me returns 401 afterwards). */
async function logout(): Promise<void> {
  await apiRequest({ method: 'POST', url: API_ENDPOINTS.auth.logout });
}

/**
 * The backend has no password-reset or email-verification route (both 404
 * on 2026-10-08). These reject with a clear message instead of guessing.
 */
function unsupportedAuthOperation(operation: string): Promise<never> {
  return Promise.reject(new ApiError({ kind: 'unknown', message: `${operation} is not available yet.` }));
}

function resetPassword(_email: string): Promise<void> {
  return unsupportedAuthOperation('Password reset');
}

function verifyEmail(_code: string): Promise<void> {
  return unsupportedAuthOperation('Email verification');
}

export const authApi = { login, register, me, logout, resetPassword, verifyEmail };
