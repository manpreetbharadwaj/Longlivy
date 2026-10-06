import { env } from '@/config/env';

/**
 * Every backend route the app knows about, in one place — so adding a new
 * API means adding one line here plus one function in the relevant
 * `*Api.ts` module, never a hardcoded string inside a screen or service.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/login',
    register: '/register',
    me: '/me',
  },
  user: {
    me: '/me',
  },
  goals: {
    collection: '/goals',
    show: (id: string) => `/show/${encodeURIComponent(id)}`,
    byId: (id: string) => `/goals/${encodeURIComponent(id)}`,
    progress: (id: string) => `/goals/${encodeURIComponent(id)}/progress`,
  },
  streaks: {
    collection: '/streaks',
    byType: (type: string) => `/streaks/${encodeURIComponent(type)}`,
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
