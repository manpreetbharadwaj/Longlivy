import { env } from '@/config/env';

const seg = (value: string | number) => encodeURIComponent(String(value));

/**
 * Every backend route the app knows about, in one place — so adding a new
 * API means adding one line here plus one function in the relevant
 * `*Api.ts` module, never a hardcoded string inside a screen or service.
 *
 * Paths were verified against the live LongLivy API on 2026-10-08.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout',
  },
  profile: '/profile',
  goals: {
    collection: '/goals',
    byId: (id: string) => `/goals/${seg(id)}`,
    progress: (id: string) => `/goals/${seg(id)}/progress`,
  },
  streaks: {
    collection: '/streaks',
    byType: (type: string) => `/streaks/${seg(type)}`,
  },
  fasting: {
    collection: '/fasting',
    active: '/fasting/active',
    summary: '/fasting/summary',
    byId: (id: string) => `/fasting/${seg(id)}`,
    end: (id: string) => `/fasting/${seg(id)}/end`,
  },
  weightLogs: {
    collection: '/weight-logs',
    byId: (id: string) => `/weight-logs/${seg(id)}`,
  },
  foods: {
    collection: '/foods',
    byId: (id: string) => `/foods/${seg(id)}`,
    barcode: (code: string) => `/foods/barcode/${seg(code)}`,
  },
  meals: {
    collection: '/meals',
    byId: (id: string) => `/meals/${seg(id)}`,
    items: (mealId: string) => `/meals/${seg(mealId)}/items`,
    item: (mealId: string, itemId: string) => `/meals/${seg(mealId)}/items/${seg(itemId)}`,
  },
  recipes: {
    collection: '/recipes',
    byId: (id: string) => `/recipes/${seg(id)}`,
  },
  favorites: {
    collection: '/favorites',
    byId: (id: string) => `/favorites/${seg(id)}`,
  },
  nutrition: {
    recognize: '/nutrition/recognize',
  },
  energy: {
    balance: '/energy/balance',
    bmr: '/energy/bmr',
    calculateTargets: '/energy/targets/calculate',
  },
  meditation: {
    contents: '/meditation',
    byId: (id: string) => `/meditation/${seg(id)}`,
    categories: '/meditation/categories',
    home: '/meditation/home',
    stats: '/meditation/stats',
    sessions: '/meditation/sessions',
    activeSession: '/meditation/sessions/active',
    session: (id: string) => `/meditation/sessions/${seg(id)}`,
    sessionAction: (id: string, action: 'pause' | 'resume' | 'complete' | 'cancel') => `/meditation/sessions/${seg(id)}/${action}`,
    goals: '/meditation/goals',
    reminders: '/meditation/reminders',
    reminder: (id: string) => `/meditation/reminders/${seg(id)}`,
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
