import { apiRequestParsed } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { ApiError } from '@/utils/apiError';
import { GoalProgress, GoalProgressInput } from '@/features/goals/models';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim();
}

function numeric(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function unwrap(value: unknown): unknown {
  if (!isRecord(value)) return value;
  for (const key of ['data', 'progress', 'result', 'item']) {
    if (key in value) return unwrap(value[key]);
  }
  return value;
}

function mapProgress(value: unknown, goalId: string): GoalProgress {
  const raw = unwrap(value);
  if (!isRecord(raw)) throw new ApiError({ kind: 'malformed' });
  const progressValue = numeric(raw.value, raw.progress, raw.amount);
  const date = text(raw.date, raw.progress_date, raw.recorded_at, raw.recordedAt);
  if (progressValue === undefined || !date) throw new ApiError({ kind: 'malformed' });
  return {
    id: text(raw.id, raw.progress_id, raw.progressId),
    goalId: text(raw.goal_id, raw.goalId) ?? goalId,
    value: progressValue,
    date,
    completed: raw.completed === true || raw.completed === 'true' || raw.completed === 1,
  };
}

function wirePayload(input: GoalProgressInput): RecordValue {
  return { date: input.date, value: input.value, completed: input.completed };
}

function getGoalProgress(goalId: string): Promise<GoalProgress[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.goals.progress(goalId) }, (value) => {
    const raw = unwrap(value);
    const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.items) ? raw.items : [raw];
    return list.map((item) => mapProgress(item, goalId));
  });
}

function updateGoalProgress(goalId: string, input: GoalProgressInput): Promise<GoalProgress> {
  return apiRequestParsed(
    { method: 'POST', url: API_ENDPOINTS.goals.progress(goalId), data: wirePayload(input) },
    (value) => mapProgress(value, goalId),
  );
}

export const progressApi = { getGoalProgress, updateGoalProgress };
