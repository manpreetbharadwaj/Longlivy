import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { AuthApiUser } from './authApi';
import { ApiError } from '@/utils/apiError';

export type UserApiProfile = AuthApiUser;

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

export interface ReauthenticatePayload {
  email: string;
  password: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function unwrapUser(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed' });
  const data = isRecord(value.data) ? value.data : value;
  const user = isRecord(data.user) ? data.user : isRecord(data.profile) ? data.profile : data;
  return user;
}

/** Converts the documented `/me` response without trusting its JSON shape. */
export function normalizeUserProfile(value: unknown): UserApiProfile {
  const user = unwrapUser(value);
  const id = stringValue(user.id) ?? stringValue(user.userId);
  const email = stringValue(user.email);
  const firstName = stringValue(user.firstName) ?? stringValue(user.first_name);
  const lastName = stringValue(user.lastName) ?? stringValue(user.last_name);
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

/** The documented `/me` call is a credentialed reauthentication request. */
function reauthenticate(payload: ReauthenticatePayload): Promise<UserApiProfile> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.user.me, data: payload, skipAuth: true }, normalizeUserProfile);
}

/**
 * Kept for the repository interface, but intentionally does not guess an
 * update route. The documented `/me` contract is read-only until specified.
 */
function updateProfile(_payload: UpdateProfilePayload): Promise<UserApiProfile> {
  return Promise.reject(new ApiError({ kind: 'unknown', message: 'Profile updates are not supported by the documented API.' }));
}

/** Search has no documented route; avoid retaining the old `/users/search` assumption. */
function searchUsers(_query: string, _signal?: AbortSignal): Promise<UserApiProfile[]> {
  return Promise.reject(new ApiError({ kind: 'unknown', message: 'User search is not supported by the documented API.' }));
}

export const userApi = { reauthenticate, updateProfile, searchUsers };
