import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { apiConfig, API_ENDPOINTS } from './apiConfig';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { normalizeApiError } from '@/utils/apiError';

/**
 * Centralized Axios API client.
 *
 * This is the ONLY Axios instance in the app — every `*Api.ts` service
 * module imports `apiClient` from here rather than creating its own
 * instance. See API_MIGRATION.md for how this plugs into the existing
 * repository-swap architecture.
 */

declare module 'axios' {
  // Augmenting the base config (not just InternalAxiosRequestConfig) so these
  // fields are visible both to callers building a request and to the
  // interceptors that later receive the resolved/internal config.
  interface AxiosRequestConfig {
    /** Mark a request as not requiring an Authorization header (login, register, public content, ...). */
    skipAuth?: boolean;
    /** Internal — set once a request has already gone through one 401-retry, to prevent infinite retry loops. */
    _retry?: boolean;
    /** Internal — wall-clock start time, used only for dev logging. */
    _requestStartedAt?: number;
  }
}

export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeoutMs,
  headers: apiConfig.defaultHeaders,
});

// ---------------------------------------------------------------------------
// Request interceptor — attaches the access token unless the request opted
// out via `skipAuth: true`. No API function ever sets the header itself.
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (env.enableApiLogging) config._requestStartedAt = Date.now();

  if (!config.skipAuth) {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return config;
});

// ---------------------------------------------------------------------------
// 401 refresh queue.
//
// If N requests fail with 401 at the same time, only ONE refresh call is
// made; the other N-1 requests wait on `pendingQueue` and are released with
// the same new token once it arrives (or all rejected together if the
// refresh itself fails).
// ---------------------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

function resolveQueue(token: string) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectQueue(error: unknown) {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

// ---------------------------------------------------------------------------
// Response interceptor — dev logging + normalized errors + the 401 →
// refresh → retry flow. authService is imported lazily (only once we're
// actually inside the 401 branch) to avoid a circular import: authService
// depends on authApi, which depends on this file.
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    logResponse(response.config, response.status);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    logResponse(config, error.response?.status ?? null);

    const status = error.response?.status;
    const isRefreshCall = config?.url === API_ENDPOINTS.auth.refresh;

    if (status !== 401 || !config || config._retry || config.skipAuth || isRefreshCall) {
      return Promise.reject(error);
    }

    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      const { authService } = await import('@/services/auth/authService');
      await authService.logout();
      return Promise.reject(error);
    }

    config._retry = true;

    if (isRefreshing) {
      // A refresh is already in flight — queue behind it instead of firing a second one.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            config.headers.set('Authorization', `Bearer ${token}`);
            resolve(apiClient(config));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { authService } = await import('@/services/auth/authService');
      const newAccessToken = await authService.refreshAccessToken(refreshToken);
      resolveQueue(newAccessToken);
      config.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(config);
    } catch (refreshError) {
      rejectQueue(refreshError);
      const { authService } = await import('@/services/auth/authService');
      await authService.logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

function logResponse(config: InternalAxiosRequestConfig | undefined, status: number | null) {
  if (!env.enableApiLogging || !config) return;
  const elapsedMs = config._requestStartedAt ? Date.now() - config._requestStartedAt : null;
  // Method/URL/status/timing only — never headers or body, so a token or
  // password can never end up in a log line.
  // eslint-disable-next-line no-console
  console.log(`[api] ${config.method?.toUpperCase()} ${config.url} -> ${status ?? 'ERR'}${elapsedMs != null ? ` (${elapsedMs}ms)` : ''}`);
}

/**
 * Thin wrapper every `*Api.ts` function should use instead of calling
 * `apiClient.request` directly — resolves to normalized data on success and
 * always throws a normalized `ApiError` (never a raw AxiosError) on failure.
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
