import { env } from '@/config/env';
import { goalsApi as remoteGoalsApi } from '@/services/api/goalsApi';
import { Goal, GoalCreateInput, GoalProgress, GoalProgressInput, GoalUpdateInput, MOCK_GOALS } from './models';

/**
 * Domain adapter for goals. The only network calls live in
 * `src/services/api/goalsApi.ts`; this module keeps the explicit local-mock
 * behavior compatible with the prototype while the backend is unavailable.
 */
let mockGoals = MOCK_GOALS.map((goal) => ({ ...goal }));
const mockProgress: Record<string, GoalProgress[]> = {};

function mockGoal(id: string): Goal {
  const goal = mockGoals.find((candidate) => candidate.id === id);
  if (!goal) throw new Error('The requested goal could not be found.');
  return { ...goal };
}

async function listGoals(): Promise<Goal[]> {
  return env.useMockApi ? mockGoals.map((goal) => ({ ...goal })) : remoteGoalsApi.getGoals();
}

async function createGoal(input: GoalCreateInput): Promise<Goal> {
  if (!env.useMockApi) return remoteGoalsApi.createGoal(input);
  const goal: Goal = {
    ...input,
    id: `goal_${Date.now()}`,
    userId: input.userId ?? '',
    active: input.active ?? true,
    source: input.source ?? 'manual',
  };
  mockGoals = [...mockGoals, goal];
  return { ...goal };
}

async function getGoalByShowId(id: string): Promise<Goal> {
  return env.useMockApi ? mockGoal(id) : remoteGoalsApi.getGoalByShowId(id);
}

async function getGoalById(id: string): Promise<Goal> {
  return env.useMockApi ? mockGoal(id) : remoteGoalsApi.getGoalById(id);
}

async function updateGoal(id: string, changes: GoalUpdateInput): Promise<Goal> {
  if (!env.useMockApi) return remoteGoalsApi.updateGoal(id, changes);
  const current = mockGoal(id);
  const updated: Goal = { ...current, ...changes, id, source: changes.source ?? current.source };
  mockGoals = mockGoals.map((goal) => (goal.id === id ? updated : goal));
  return { ...updated };
}

async function deleteGoal(id: string): Promise<void> {
  if (!env.useMockApi) return remoteGoalsApi.deleteGoal(id);
  mockGoal(id);
  mockGoals = mockGoals.filter((goal) => goal.id !== id);
}

async function getGoalProgress(id: string): Promise<GoalProgress[]> {
  if (!env.useMockApi) return remoteGoalsApi.getGoalProgress(id);
  return (mockProgress[id] ?? []).map((progress) => ({ ...progress }));
}

async function createGoalProgress(id: string, input: GoalProgressInput): Promise<GoalProgress> {
  if (!env.useMockApi) return remoteGoalsApi.updateGoalProgress(id, input);
  const progress: GoalProgress = { ...input, id: `progress_${Date.now()}`, goalId: id };
  mockProgress[id] = [...(mockProgress[id] ?? []), progress];
  return { ...progress };
}

export const goalsApi = {
  listGoals,
  getGoals: listGoals,
  createGoal,
  postGoal: createGoal,
  getGoalByShowId,
  fetchGoalByShowId: getGoalByShowId,
  getGoalById,
  fetchGoalById: getGoalById,
  updateGoal,
  putGoal: updateGoal,
  deleteGoal,
  removeGoal: deleteGoal,
  getGoalProgress,
  fetchGoalProgress: getGoalProgress,
  createGoalProgress,
  postGoalProgress: createGoalProgress,
};
