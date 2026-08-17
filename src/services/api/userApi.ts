import { apiRequest } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';

/**
 * Example of the pattern to follow for every new API added later: one
 * function per endpoint, typed request/response shapes, no Axios calls
 * anywhere outside `apiClient.ts`. Copy this file's shape for the next
 * feature (e.g. `nutritionApi.ts`, `activityApi.ts`, ...).
 */

export interface UserApiProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

function getCurrentUser(): Promise<UserApiProfile> {
  return apiRequest<UserApiProfile>({ method: 'GET', url: API_ENDPOINTS.user.me });
}

function updateProfile(payload: UpdateProfilePayload): Promise<UserApiProfile> {
  return apiRequest<UserApiProfile>({ method: 'PATCH', url: API_ENDPOINTS.user.updateProfile, data: payload });
}

/**
 * Cancellation example — pass an AbortSignal through for any request that
 * can be superseded by a newer one (search-as-you-type, a filter changing,
 * a screen unmounting mid-request). Axios maps `signal` straight onto the
 * underlying fetch/XHR abort machinery; no extra library needed.
 *
 * Usage in a screen/hook:
 *
 *   const controller = new AbortController();
 *   userApi.searchUsers(query, controller.signal).then(setResults).catch((e) => {
 *     if (e.kind !== 'cancelled') showError(e);
 *   });
 *   // on next keystroke or unmount:
 *   controller.abort();
 */
function searchUsers(query: string, signal?: AbortSignal): Promise<UserApiProfile[]> {
  return apiRequest<UserApiProfile[]>({ method: 'GET', url: API_ENDPOINTS.user.search, params: { q: query }, signal });
}

export const userApi = { getCurrentUser, updateProfile, searchUsers };
