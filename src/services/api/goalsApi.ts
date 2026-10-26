import { apiRequestParsed, apiRequest } from './apiClient';
import { API_ENDPOINTS } from './apiConfig';
import { ApiError } from '@/utils/apiError';
import { Goal, GoalCreateInput, GoalProgress, GoalProgressInput, GoalUpdateInput } from '@/features/goals/models';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function number(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function boolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    if (['true', '1', 'yes'].includes(value.trim().toLowerCase())) return true;
    if (['false', '0', 'no'].includes(value.trim().toLowerCase())) return false;
  }
  return fallback;
}

function unwrapSingle(value: unknown): unknown {
  if (!isRecord(value)) return value;
  for (const key of ['data', 'goal', 'progress', 'result', 'item', 'payload']) {
    if (key in value) return unwrapSingle(value[key]);
  }
  return value;
}

function unwrapList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) throw new ApiError({ kind: 'malformed', message: 'The goals response did not contain a list.' });
  for (const key of ['goals', 'progress', 'items', 'results', 'records', 'data']) {
    if (key in value) return unwrapList(value[key]);
  }
  throw new ApiError({ kind: 'malformed', message: 'The goals response did not contain a list.' });
}

/**
 * Goals created via /meditation/goals come back as `goal_type: "meditation"`
 * with the unit telling minutes from sessions; the app models those as two types.
 */
function appGoalType(type: string, unit: string): Goal['type'] {
  if (type !== 'meditation') return type as Goal['type'];
  return /session/i.test(unit) ? 'meditation_sessions' : 'meditation_minutes';
}

function mapGoal(value: unknown): Goal {
  const raw = unwrapSingle(value);
  if (!isRecord(raw)) throw new ApiError({ kind: 'malformed' });
  const id = text(raw.id, raw.goal_id, raw.goalId);
  const type = text(raw.goal_type, raw.goalType, raw.type);
  // The live API nests the target: `target: { value: "2200.00", unit: "kcal" }`.
  const nestedTarget = isRecord(raw.target) ? raw.target : undefined;
  const target = number(nestedTarget?.value, raw.target_value, raw.targetValue, raw.target, raw.value);
  if (!id || !type || target === undefined) throw new ApiError({ kind: 'malformed' });

  const unit = text(nestedTarget?.unit, raw.unit) ?? '';
  return {
    id,
    userId: text(raw.user_id, raw.userId, isRecord(raw.user) ? raw.user.id : undefined) ?? '',
    type: appGoalType(type, unit),
    name: text(raw.name),
    description: text(raw.description),
    target,
    unit,
    period: text(raw.period) ?? 'day',
    startDate: text(raw.start_date, raw.startDate),
    endDate: text(raw.end_date, raw.endDate),
    // The API returns `active: null` for goals created without the flag; treat that as active.
    active: boolean(raw.active ?? raw.is_active, true),
    // POST /energy/targets/calculate stores `longlivy_calculated`; goals created by hand default to `manual`.
    source: raw.source === 'auto' || raw.source === 'longlivy_calculated' ? 'auto' : 'manual',
  };
}

function mapProgress(value: unknown, goalId: string): GoalProgress {
  const raw = unwrapSingle(value);
  if (!isRecord(raw)) throw new ApiError({ kind: 'malformed' });
  const progressValue = number(raw.value, raw.progress, raw.amount);
  const date = text(raw.date, raw.progress_date, raw.recorded_at, raw.recordedAt);
  if (progressValue === undefined || !date) throw new ApiError({ kind: 'malformed' });
  return {
    id: text(raw.id, raw.progress_id, raw.progressId),
    goalId: text(raw.goal_id, raw.goalId) ?? goalId,
    value: progressValue,
    date,
    completed: boolean(raw.completed, false),
  };
}

function goalWirePayload(input: GoalCreateInput | GoalUpdateInput): RecordValue {
  const source = input as RecordValue;
  const output: RecordValue = {};
  const copy = (wire: string, ...keys: string[]) => {
    const value = keys.map((key) => source[key]).find((candidate) => candidate !== undefined);
    if (value !== undefined) output[wire] = value;
  };

  copy('goal_type', 'type', 'goalType');
  copy('name', 'name');
  copy('description', 'description');
  copy('target_value', 'target', 'targetValue');
  copy('unit', 'unit');
  copy('period', 'period');
  copy('start_date', 'startDate', 'start_date');
  copy('end_date', 'endDate', 'end_date');
  copy('active', 'active');
  return output;
}

function progressWirePayload(input: GoalProgressInput): RecordValue {
  return { date: input.date, value: input.value, completed: input.completed };
}

function getGoals(): Promise<Goal[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.goals.collection }, (value) => unwrapList(value).map(mapGoal));
}

function createGoal(input: GoalCreateInput): Promise<Goal> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.goals.collection, data: goalWirePayload(input) }, mapGoal);
}

function getGoalById(id: string): Promise<Goal> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.goals.byId(id) }, mapGoal);
}

function updateGoal(id: string, input: GoalUpdateInput): Promise<Goal> {
  return apiRequestParsed({ method: 'PUT', url: API_ENDPOINTS.goals.byId(id), data: goalWirePayload(input) }, mapGoal);
}

async function deleteGoal(id: string): Promise<void> {
  const response = await apiRequest<unknown>({ method: 'DELETE', url: API_ENDPOINTS.goals.byId(id) });
  if (isRecord(response) && (response.success === false || response.ok === false)) {
    throw new ApiError({ kind: 'unknown', message: text(response.message, response.error) ?? 'The goal could not be deleted.' });
  }
}

function getGoalProgress(id: string): Promise<GoalProgress[]> {
  return apiRequestParsed({ method: 'GET', url: API_ENDPOINTS.goals.progress(id) }, (value) => unwrapList(value).map((item) => mapProgress(item, id)));
}

function updateGoalProgress(id: string, input: GoalProgressInput): Promise<GoalProgress> {
  return apiRequestParsed({ method: 'POST', url: API_ENDPOINTS.goals.progress(id), data: progressWirePayload(input) }, (value) => mapProgress(value, id));
}

export const goalsApi = {
  getGoals,
  createGoal,
  /** The documented `/show/{id}` route does not exist on the live API (404); `/goals/{id}` is the detail route. */
  getGoalByShowId: getGoalById,
  getGoalById,
  updateGoal,
  deleteGoal,
  getGoalProgress,
  updateGoalProgress,
};

export { goalWirePayload, mapGoal, mapProgress, progressWirePayload, unwrapList, unwrapSingle };
