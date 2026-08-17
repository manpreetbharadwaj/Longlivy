import { apiRequest } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';

/**
 * Pure HTTP calls for the auth domain — nothing here touches Redux, token
 * storage, or navigation. `authService.ts` and `ApiAuthRepository.ts` are
 * the layers that give these calls meaning; this file only knows how to
 * talk to the backend.
 */

export interface AuthApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

export interface AuthApiTokens {
  accessToken: string;
  refreshToken: string | null;
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
}

function login(payload: LoginPayload): Promise<AuthApiSession> {
  return apiRequest<AuthApiSession>({ method: 'POST', url: API_ENDPOINTS.auth.login, data: payload, skipAuth: true });
}

function register(payload: RegisterPayload): Promise<AuthApiSession> {
  return apiRequest<AuthApiSession>({ method: 'POST', url: API_ENDPOINTS.auth.register, data: payload, skipAuth: true });
}

/** Called only by authService's refresh flow — never call this directly from a screen. */
function refreshToken(refreshToken: string): Promise<AuthApiTokens> {
  return apiRequest<AuthApiTokens>({ method: 'POST', url: API_ENDPOINTS.auth.refresh, data: { refreshToken }, skipAuth: true });
}

function logout(): Promise<void> {
  return apiRequest<void>({ method: 'POST', url: API_ENDPOINTS.auth.logout });
}

function resetPassword(email: string): Promise<void> {
  return apiRequest<void>({ method: 'POST', url: API_ENDPOINTS.auth.resetPassword, data: { email }, skipAuth: true });
}

function verifyEmail(code: string): Promise<void> {
  return apiRequest<void>({ method: 'POST', url: API_ENDPOINTS.auth.verifyEmail, data: { code } });
}

export const authApi = { login, register, refreshToken, logout, resetPassword, verifyEmail };
