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

/**
 * The documented LongLivy API origin.  A build may still override this for a
 * local/staging deployment, but an omitted URL must not silently point at an
 * undocumented server.
 */
const DEFAULT_API_BASE_URL = 'https://longlivy.digitallhut.com/api/v1';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

/**
 * Mock mode is deliberately independent from the URL.  This keeps the local
 * repositories available when the documented backend is offline, while also
 * making it impossible for changing a URL to accidentally change which data
 * source the app uses.
 */
function resolveBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

// Keep the existing prototype usable while the supplied deployment is
// returning 404 for every documented route. Set EXPO_PUBLIC_USE_MOCK_API=false
// in a backend-enabled build to exercise the real API path.
const useMockApi = resolveBoolean(process.env.EXPO_PUBLIC_USE_MOCK_API, true);

const parsedTimeout = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
const apiTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 15000;

export const env = {
  appEnv,
  isDev: appEnv === 'development',
  apiBaseUrl,
  apiTimeoutMs,
  useMockApi,
  /** Verbose request/response logging — always off in production regardless of this flag. */
  enableApiLogging: __DEV__ && process.env.EXPO_PUBLIC_API_LOGGING !== 'false',
};
