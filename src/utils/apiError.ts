import { AxiosError } from 'axios';

/** Categories callers can safely branch on without knowing Axios details. */
export type ApiErrorKind =
  | 'bad_request' // 400
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not_found' // 404
  | 'conflict' // 409
  | 'validation' // 422
  | 'rate_limited' // 429
  | 'server' // 5xx
  | 'network' // no response reached the server
  | 'timeout' // the request exceeded its timeout
  | 'malformed' // a response could not be safely interpreted
  | 'cancelled' // request was aborted/cancelled
  | 'unknown';

export type ValidationErrors = Record<string, string[]>;

export interface ApiErrorInit {
  kind: ApiErrorKind;
  status?: number | null;
  message?: string;
  validationErrors?: ValidationErrors | null;
  retryAfterMs?: number | null;
  cause?: unknown;
}

/**
 * The normalized error is an Error as well as a typed value. This lets the
 * existing Redux error handling keep showing a useful message while callers
 * can switch on `kind` and `status`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly validationErrors: ValidationErrors | null;
  readonly retryAfterMs: number | null;
  readonly cause: unknown;

  constructor({ kind, status = null, message, validationErrors = null, retryAfterMs = null, cause }: ApiErrorInit) {
    super(message || DEFAULT_MESSAGES[kind]);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.validationErrors = validationErrors;
    this.retryAfterMs = retryAfterMs;
    this.cause = cause;
  }
}

/** Raised by response parsers when the server returned an unsupported shape. */
export class MalformedApiResponseError extends Error {
  readonly received: unknown;

  constructor(received: unknown) {
    super(DEFAULT_MESSAGES.malformed);
    this.name = 'MalformedApiResponseError';
    this.received = received;
  }
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  bad_request: 'The request could not be processed.',
  unauthorized: 'Your session has expired. Please log in again.',
  forbidden: "You don't have permission to do that.",
  not_found: 'The requested resource could not be found.',
  conflict: 'This request conflicts with existing data.',
  validation: 'Some of the information provided is invalid.',
  rate_limited: 'Too many requests. Please try again shortly.',
  server: 'Something went wrong on our end. Please try again shortly.',
  network: 'Unable to reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  malformed: 'The server returned an unexpected response.',
  cancelled: 'The request was cancelled.',
  unknown: 'An unexpected error occurred.',
};

function kindForStatus(status: number): ApiErrorKind {
  if (status === 400) return 'bad_request';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asMessage(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function responseMessage(data: unknown): string | undefined {
  if (!isRecord(data)) return undefined;
  return asMessage(data.message) ?? asMessage(data.error) ?? asMessage(data.detail);
}

function normalizeValidationErrors(value: unknown): ValidationErrors | null {
  if (!isRecord(value)) return null;
  const output: ValidationErrors = {};
  for (const [field, messages] of Object.entries(value)) {
    const list = Array.isArray(messages) ? messages : [messages];
    const strings = list.filter((message): message is string => typeof message === 'string' && message.trim().length > 0).map((message) => message.trim());
    if (strings.length > 0) output[field] = strings;
  }
  return Object.keys(output).length > 0 ? output : null;
}

function responseValidationErrors(data: unknown): ValidationErrors | null {
  if (!isRecord(data)) return null;
  return normalizeValidationErrors(data.errors) ?? normalizeValidationErrors(data.fieldErrors) ?? normalizeValidationErrors(data.validationErrors);
}

function retryAfterMs(data: unknown): number | null {
  if (!isRecord(data)) return null;
  const value = data.retryAfterMs ?? data.retry_after_ms;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function isNormalizedApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && (error as { isAxiosError?: boolean }).isAxiosError === true;
}

/** Converts Axios, parser, network, and unknown failures to one safe shape. */
export function normalizeApiError(error: unknown): ApiError {
  if (isNormalizedApiError(error)) return error;

  if (error instanceof MalformedApiResponseError) {
    return new ApiError({ kind: 'malformed', message: error.message, cause: error });
  }

  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') {
      return new ApiError({ kind: 'cancelled', message: DEFAULT_MESSAGES.cancelled, cause: error });
    }

    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || /timeout/i.test(error.message || '');
    if (isTimeout) {
      return new ApiError({ kind: 'timeout', message: DEFAULT_MESSAGES.timeout, cause: error });
    }

    if (!error.response) {
      return new ApiError({ kind: 'network', message: DEFAULT_MESSAGES.network, cause: error });
    }

    const status = error.response.status;
    const kind = kindForStatus(status);
    const body = error.response.data;
    return new ApiError({
      kind,
      status,
      message: responseMessage(body) ?? DEFAULT_MESSAGES[kind],
      validationErrors: kind === 'validation' ? responseValidationErrors(body) : null,
      retryAfterMs: kind === 'rate_limited' ? retryAfterMs(body) : null,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ kind: 'unknown', message: error.message || DEFAULT_MESSAGES.unknown, cause: error });
  }

  return new ApiError({ kind: 'unknown', message: DEFAULT_MESSAGES.unknown, cause: error });
}

/** True only for an expired/invalid access token response. */
export function isAuthFailure(error: ApiError): boolean {
  return error.kind === 'unauthorized';
}
