import { DEMO_USER_ID } from '@/mock/demoUser';

export type GoalType =
  | 'calories'
  | 'protein'
  | 'carbohydrates'
  | 'fat'
  | 'fiber'
  | 'fasting_hours'
  | 'activity_minutes'
  | 'meditation_minutes'
  | 'meditation_sessions'
  | 'weight'
  // Keep new server-defined goal types renderable without weakening the rest
  // of the domain model to an untyped object.
  | (string & {});

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  name?: string;
  description?: string;
  target: number;
  unit: string;
  period: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  source: 'auto' | 'manual';
}

/** The app-facing shape for POST /goals. The API adapter serializes this to snake_case. */
export interface GoalCreateInput {
  type: GoalType;
  name?: string;
  description?: string;
  target: number;
  unit: string;
  period: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  source?: 'auto' | 'manual';
  userId?: string;
}

/** The app-facing shape for PUT /goals/{id}. */
export type GoalUpdateInput = Partial<Omit<GoalCreateInput, 'type' | 'target'>> & {
  type?: GoalType;
  target?: number;
  userId?: string;
};

export interface GoalProgress {
  id?: string;
  goalId: string;
  value: number;
  date?: string;
  completed?: boolean;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface GoalProgressInput {
  value: number;
  date: string;
  completed: boolean;
}

/**
 * Local-only seed data. It is deliberately kept in the domain module so the
 * mock API and the Redux initial state share the same explicit mock mode.
 */
export const MOCK_GOALS: Goal[] = [
  { id: 'goal_calories', userId: DEMO_USER_ID, type: 'calories', target: 2200, unit: 'kcal', period: 'day', active: true, source: 'auto' },
  { id: 'goal_protein', userId: DEMO_USER_ID, type: 'protein', target: 150, unit: 'g', period: 'day', active: true, source: 'auto' },
  { id: 'goal_fasting', userId: DEMO_USER_ID, type: 'fasting_hours', target: 16, unit: 'h', period: 'day', active: true, source: 'auto' },
  { id: 'goal_activity', userId: DEMO_USER_ID, type: 'activity_minutes', target: 30, unit: 'min', period: 'day', active: true, source: 'auto' },
  { id: 'goal_meditation', userId: DEMO_USER_ID, type: 'meditation_minutes', target: 10, unit: 'min', period: 'day', active: true, source: 'auto' },
  { id: 'goal_meditation_weekly', userId: DEMO_USER_ID, type: 'meditation_sessions', target: 5, unit: 'sessions', period: 'week', active: true, source: 'manual' },
];
