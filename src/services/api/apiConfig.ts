import { env } from '@/config/env';

/**
 * Every backend route the app knows about, in one place — so adding a new
 * API means adding one line here plus one function in the relevant
 * `*Api.ts` module, never a hardcoded string inside a screen or service.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },
  user: {
    me: '/users/me',
    updateProfile: '/users/me',
    search: '/users/search',
  },
} as const;

export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  timeoutMs: env.apiTimeoutMs,
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;
