/**
 * Central environment configuration.
 *
 * Expo (SDK 49+) inlines any `EXPO_PUBLIC_*` variable from `.env` files at
 * build time — no extra dependency needed. See `.env.example` at the
 * project root for the variables this file reads.
 *
 * Nothing outside this file should read `process.env.EXPO_PUBLIC_*`
 * directly — that keeps every environment-dependent value defined and
 * defaulted in exactly one place.
 */

export type AppEnv = 'development' | 'staging' | 'production';

function resolveAppEnv(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'staging' || raw === 'production') return raw;
  return 'development';
}

const appEnv = resolveAppEnv();

/** Per-environment fallback base URLs, used only when EXPO_PUBLIC_API_BASE_URL isn't set. */
const DEFAULT_API_BASE_URLS: Record<AppEnv, string> = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.longlivy.app/api',
  production: 'https://api.longlivy.app/api',
};

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URLS[appEnv];

/**
 * No real backend exists yet for this prototype (see API_MIGRATION.md).
 * The app keeps using the local Mock*Repository implementations until an
 * actual API base URL is supplied — flip this on by setting
 * EXPO_PUBLIC_API_BASE_URL in .env once a backend is available. This is the
 * single switch that moves auth (and, feature by feature, everything else)
 * from mock to real.
 */
const useMockApi = !process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const env = {
  appEnv,
  isDev: appEnv === 'development',
  apiBaseUrl,
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 15000,
  useMockApi,
  /** Verbose request/response logging — always off in production regardless of this flag. */
  enableApiLogging: __DEV__ && process.env.EXPO_PUBLIC_API_LOGGING !== 'false',
};
