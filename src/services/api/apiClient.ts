import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { apiConfig } from './apiConfig';
import { env } from '@/config/env';
import { tokenStorage } from '@/services/auth/tokenStorage';
import { ApiError, MalformedApiResponseError, normalizeApiError } from '@/utils/apiError';

/**
 * The only Axios instance used by backend services. Authentication is kept
 * deliberately small: the documented API supplies an access token at login
 * or registration, but does not document refresh or logout endpoints.
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    /** Do not attach the stored bearer token (login/register are public). */
    skipAuth?: boolean;
    /** Internal request timing used by development-only method/status logging. */
    _requestStartedAt?: number;
  }
}

export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: apiConfig.timeoutMs,
  headers: apiConfig.defaultHeaders,
});

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

apiClient.interceptors.response.use(
  (response) => {
    logResponse(response.config, response.status);
    return response;
  },
  async (error: unknown) => {
    const config = isAxiosRequestError(error) ? (error.config as InternalAxiosRequestConfig | undefined) : undefined;
    const status = isAxiosRequestError(error) ? error.response?.status ?? null : null;
    logResponse(config, status);
    if (status === 401 && config && !config.skipAuth) {
      const { authService } = await import('@/services/auth/authService');
      await authService.expireLocalSession().catch(() => undefined);
    }
    return Promise.reject(normalizeApiError(error));
  },
);

function isAxiosRequestError(error: unknown): error is { config?: AxiosRequestConfig; response?: { status?: number } } {
  return typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError === true;
}

function logResponse(config: InternalAxiosRequestConfig | undefined, status: number | null) {
  if (!env.enableApiLogging || !config) return;
  const elapsedMs = config._requestStartedAt ? Date.now() - config._requestStartedAt : null;
  // Method, URL, status, and timing only. Never include headers, query values,
  // request bodies, or response bodies in logs.
   
  const safeUrl = config.url?.split(/[?#]/, 1)[0] ?? '';
  console.log(`[api] ${config.method?.toUpperCase()} ${safeUrl} -> ${status ?? 'ERR'}${elapsedMs != null ? ` (${elapsedMs}ms)` : ''}`);
}

/**
 * Services use this wrapper so every failure is an ApiError, including a
 * parser failure after Axios has received a successful HTTP response.
 */
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** A typed parser hook for endpoints whose response shape is not trusted. */
export async function apiRequestParsed<T>(config: AxiosRequestConfig, parse: (value: unknown) => T): Promise<T> {
  let response;
  try {
    response = await apiClient.request<unknown>(config);
  } catch (error) {
    throw normalizeApiError(error);
  }

  try {
    return parse(response.data);
  } catch (error) {
    // A parser runs only after a successful HTTP response, so a non-ApiError
    // thrown here is specifically a malformed-response failure.
    throw normalizeApiError(error instanceof ApiError ? error : new MalformedApiResponseError(error));
  }
}

/** Useful for callers that need to preserve the error type in a catch block. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
