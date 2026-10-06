import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { env } from '@/config/env';
import { Goal, GoalCreateInput, GoalProgress, GoalProgressInput, GoalUpdateInput, MOCK_GOALS } from './models';
import { goalsApi } from './goalsApi';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface GoalsState {
  goals: Goal[];
  status: RequestStatus;
  error: string | null;
  hasLoaded: boolean;
  detailStatus: RequestStatus;
  detailError: string | null;
  mutationStatus: RequestStatus;
  mutationError: string | null;
  progress: Record<string, GoalProgress[]>;
  progressStatus: Record<string, RequestStatus>;
  progressError: Record<string, string | null | undefined>;
}

const initialState: GoalsState = {
  // Seeds are available only when the app explicitly selected mock mode. A
  // configured backend always starts empty until GET /goals succeeds.
  goals: env.useMockApi ? MOCK_GOALS.map((goal) => ({ ...goal })) : [],
  status: 'idle',
  error: null,
  hasLoaded: false,
  detailStatus: 'idle',
  detailError: null,
  mutationStatus: 'idle',
  mutationError: null,
  progress: {},
  progressStatus: {},
  progressError: {},
};

type GoalThunkConfig = { rejectValue: string };

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to complete the goals request.';
}

export const fetchGoalsThunk = createAsyncThunk<Goal[], void, GoalThunkConfig>('goals/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await goalsApi.listGoals();
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const createGoalThunk = createAsyncThunk<Goal, GoalCreateInput, GoalThunkConfig>('goals/create', async (input, { rejectWithValue }) => {
  try {
    return await goalsApi.createGoal(input);
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchGoalByShowIdThunk = createAsyncThunk<Goal, string, GoalThunkConfig>('goals/fetchByShowId', async (id, { rejectWithValue }) => {
  try {
    return await goalsApi.getGoalByShowId(id);
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

/** Alternate helper for the documented GET /goals/{id} route. */
export const fetchGoalByIdThunk = createAsyncThunk<Goal, string, GoalThunkConfig>('goals/fetchById', async (id, { rejectWithValue }) => {
  try {
    return await goalsApi.getGoalById(id);
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export interface UpdateGoalArgs {
  id: string;
  changes?: GoalUpdateInput;
  /** `goal` is accepted as a convenience for callers that already have a domain object. */
  goal?: GoalUpdateInput;
}

export const updateGoalThunk = createAsyncThunk<Goal, UpdateGoalArgs, GoalThunkConfig>('goals/update', async ({ id, changes, goal }, { rejectWithValue }) => {
  try {
    return await goalsApi.updateGoal(id, changes ?? goal ?? {});
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const deleteGoalThunk = createAsyncThunk<string, string, GoalThunkConfig>('goals/delete', async (id, { rejectWithValue }) => {
  try {
    await goalsApi.deleteGoal(id);
    return id;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchGoalProgressThunk = createAsyncThunk<{ goalId: string; progress: GoalProgress[] }, string, GoalThunkConfig>(
  'goals/fetchProgress',
  async (goalId, { rejectWithValue }) => {
    try {
      return { goalId, progress: await goalsApi.getGoalProgress(goalId) };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  }
);

export const createGoalProgressThunk = createAsyncThunk<{ goalId: string; progress: GoalProgress | null; input: GoalProgressInput }, { goalId: string; input: GoalProgressInput }, GoalThunkConfig>(
  'goals/createProgress',
  async ({ goalId, input }, { rejectWithValue }) => {
    try {
      return { goalId, input, progress: await goalsApi.createGoalProgress(goalId, input) };
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  }
);

// Friendly aliases for consumers that use "load"/"record" terminology.
export const loadGoalsThunk = fetchGoalsThunk;
export const getGoalsThunk = fetchGoalsThunk;
export const recordGoalProgressThunk = createGoalProgressThunk;
export const getGoalProgressThunk = fetchGoalProgressThunk;

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    /** Kept for existing local callers; server-backed screens use updateGoalThunk. */
    upsertGoal(state, action: PayloadAction<Goal>) {
      const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
      if (index === -1) state.goals.push(action.payload);
      else state.goals[index] = action.payload;
    },
    /** Kept for existing mock-only callers; it does not claim a server update. */
    toggleGoal(state, action: PayloadAction<string>) {
      const goal = state.goals.find((candidate) => candidate.id === action.payload);
      if (goal) goal.active = !goal.active;
    },
    removeGoal(state, action: PayloadAction<string>) {
      state.goals = state.goals.filter((goal) => goal.id !== action.payload);
    },
    clearGoalMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoalsThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGoalsThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.hasLoaded = true;
        state.goals = action.payload;
      })
      .addCase(fetchGoalsThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message ?? 'Unable to load goals.';
        state.hasLoaded = true;
        // Never retain mock seeds (or stale server data after a failed initial
        // load) as if they came from the unreachable backend.
        state.goals = [];
      })
      .addCase(fetchGoalByShowIdThunk.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
      })
      .addCase(fetchGoalByShowIdThunk.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
        if (index === -1) state.goals.push(action.payload);
        else state.goals[index] = action.payload;
      })
      .addCase(fetchGoalByShowIdThunk.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload ?? action.error.message ?? 'Unable to load the goal.';
      })
      .addCase(fetchGoalByIdThunk.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
      })
      .addCase(fetchGoalByIdThunk.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
        if (index === -1) state.goals.push(action.payload);
        else state.goals[index] = action.payload;
      })
      .addCase(fetchGoalByIdThunk.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload ?? action.error.message ?? 'Unable to load the goal.';
      })
      .addCase(createGoalThunk.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createGoalThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.mutationError = null;
        const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
        if (index === -1) state.goals.push(action.payload);
        else state.goals[index] = action.payload;
      })
      .addCase(createGoalThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload ?? action.error.message ?? 'Unable to create the goal.';
      })
      .addCase(updateGoalThunk.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(updateGoalThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.mutationError = null;
        const index = state.goals.findIndex((goal) => goal.id === action.payload.id);
        if (index === -1) state.goals.push(action.payload);
        else state.goals[index] = action.payload;
      })
      .addCase(updateGoalThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload ?? action.error.message ?? 'Unable to update the goal.';
      })
      .addCase(deleteGoalThunk.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(deleteGoalThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.mutationError = null;
        state.goals = state.goals.filter((goal) => goal.id !== action.payload);
        delete state.progress[action.payload];
        delete state.progressStatus[action.payload];
        delete state.progressError[action.payload];
      })
      .addCase(deleteGoalThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload ?? action.error.message ?? 'Unable to delete the goal.';
      })
      .addCase(fetchGoalProgressThunk.pending, (state, action) => {
        state.progressStatus[action.meta.arg] = 'loading';
        state.progressError[action.meta.arg] = null;
      })
      .addCase(fetchGoalProgressThunk.fulfilled, (state, action) => {
        state.progressStatus[action.payload.goalId] = 'succeeded';
        state.progressError[action.payload.goalId] = null;
        state.progress[action.payload.goalId] = action.payload.progress;
      })
      .addCase(fetchGoalProgressThunk.rejected, (state, action) => {
        state.progressStatus[action.meta.arg] = 'failed';
        state.progressError[action.meta.arg] = action.payload ?? action.error.message ?? 'Unable to load goal progress.';
      })
      .addCase(createGoalProgressThunk.pending, (state) => {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      })
      .addCase(createGoalProgressThunk.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.mutationError = null;
        if (action.payload.progress) {
          const entries = state.progress[action.payload.goalId] ?? [];
          state.progress[action.payload.goalId] = [...entries, action.payload.progress];
        }
      })
      .addCase(createGoalProgressThunk.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload ?? action.error.message ?? 'Unable to record goal progress.';
      });
  },
});

export const { upsertGoal, toggleGoal, removeGoal, clearGoalMutationError } = goalsSlice.actions;
export default goalsSlice.reducer;
