import { AxiosError } from 'axios';

/**
 * Every category a caller might need to branch on. Kept small and closed
 * (not just "any HTTP status") so screens can `switch` on it instead of
 * re-deriving meaning from a raw status code every time.
 */
export type ApiErrorKind =
  | 'bad_request' // 400
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'validation' // 422
  | 'server' // 5xx
  | 'network' // no response reached the server at all
  | 'cancelled' // request was aborted/cancelled
  | 'unknown';

/** Field -> list of validation messages, e.g. `{ email: ["is already taken"] }`. */
export type ValidationErrors = Record<string, string[]>;

/**
 * The one error shape every API call in the app resolves to. Screens never
 * need to know whether a failure came from Axios, the network, or the
 * backend's JSON body — they read `.kind`, `.message`, and optionally
 * `.validationErrors`.
 */
export interface ApiError {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
  validationErrors: ValidationErrors | null;
  /** The original error, kept for logging — never rendered to the user directly. */
  cause: unknown;
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  bad_request: 'The request could not be processed.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: "You don't have permission to do that.",
  not_found: 'The requested resource could not be found.',
  validation: 'Some of the information provided is invalid.',
  server: 'Something went wrong on our end. Please try again shortly.',
  network: 'Unable to reach the server. Check your connection and try again.',
  cancelled: 'The request was cancelled.',
  unknown: 'An unexpected error occurred.',
};

function kindForStatus(status: number): ApiErrorKind {
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/**
 * Converts anything an API call might throw (AxiosError, a cancellation, a
 * plain Error, literally anything) into the single ApiError shape. This is
 * the only place status-code-to-meaning mapping happens.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') {
      return { kind: 'cancelled', status: null, message: DEFAULT_MESSAGES.cancelled, validationErrors: null, cause: error };
    }

    if (!error.response) {
      // Request was made, no response came back — DNS failure, offline, timeout, etc.
      return { kind: 'network', status: null, message: DEFAULT_MESSAGES.network, validationErrors: null, cause: error };
    }

    const status = error.response.status;
    const kind = kindForStatus(status);
    const body = error.response.data as { message?: string; errors?: ValidationErrors } | undefined;

    return {
      kind,
      status,
      message: body?.message || DEFAULT_MESSAGES[kind],
      validationErrors: kind === 'validation' ? body?.errors ?? null : null,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return { kind: 'unknown', status: null, message: error.message || DEFAULT_MESSAGES.unknown, validationErrors: null, cause: error };
  }

  return { kind: 'unknown', status: null, message: DEFAULT_MESSAGES.unknown, validationErrors: null, cause: error };
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError === true;
}

/**
 * True only for the token-expiry case the refresh flow reacts to. 403 is
 * deliberately excluded — "forbidden" means the session is valid but lacks
 * permission, which is a normal error for the screen to handle, not a
 * reason to log the user out.
 */
export function isAuthFailure(error: ApiError): boolean {
  return error.kind === 'unauthorized';
}
