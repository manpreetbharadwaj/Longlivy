import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Food, Meal, MealType, NutritionGoals } from './models';
import { nutritionRepository } from './repository/MockNutritionRepository';
import { selectCurrentUserId } from '@/features/auth/selectors';
import type { RootState } from '@/store/store';
import { hydrateCalorieThunk, setCalorieGoal } from '@/features/calories/calorieSlice';
import { env } from '@/config/env';
import { ApiError } from '@/utils/apiError';
import { generateId } from '@/utils/id';
import { NutritionTargetKey, NutritionTargets, nutritionTargetsApi, TargetDirection } from '@/services/api/nutritionTargetsApi';

/** One confirmed product in an in-progress multi-barcode scanning session — not yet saved to the backend. */
export interface ScanSessionItem {
  id: string;
  food: Food;
  quantity: number;
  mealType: MealType;
}

interface ScanSessionState {
  items: ScanSessionItem[];
  /** Default meal type applied to newly scanned items; each item can still override it. */
  commonMealType: MealType;
  saving: boolean;
  /** Set after a save attempt leaves some items unsaved (and still in `items` for retry). */
  error: string | null;
}

const initialScanSession: ScanSessionState = {
  items: [],
  commonMealType: 'snack',
  saving: false,
  error: null,
};

interface NutritionState {
  todayMeals: Meal[];
  searchResults: Food[];
  favorites: Food[];
  goals: NutritionGoals;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  searchStatus: 'idle' | 'loading' | 'succeeded' | 'failed' | 'empty';
  /** API mode: server state of each target (goal id etc.). Empty in mock mode. */
  serverTargets: NutritionTargets;
  targetsError: string | null;
  scanSession: ScanSessionState;
}

const initialState: NutritionState = {
  todayMeals: [],
  searchResults: [],
  favorites: [],
  goals: {
    calories: { target: 2200, active: true, source: 'auto' },
    protein: { target: 150, active: true, source: 'auto' },
    carbohydrates: { target: 250, active: true, source: 'auto' },
    fat: { target: 75, active: true, source: 'auto' },
    fiber: { target: 30, active: true, source: 'auto' },
  },
  status: 'idle',
  searchStatus: 'idle',
  serverTargets: {},
  targetsError: null,
  scanSession: initialScanSession,
};

function directionFor(goal: string | undefined): TargetDirection {
  if (goal === 'weight_loss') return 'lose';
  if (goal === 'muscle_gain') return 'gain';
  return 'maintain';
}

/**
 * API mode: loads the daily targets stored on the server (goals of type
 * `nutrition_*`). A user without any is given server-calculated targets from
 * their profile (POST /energy/targets/calculate); `recalculate` forces that,
 * e.g. after the profile goal changes.
 */
export const loadNutritionTargetsThunk = createAsyncThunk<NutritionTargets, { recalculate?: boolean } | void, { state: RootState }>(
  'nutrition/loadTargets',
  async (arg, { getState, dispatch }) => {
    let targets = await nutritionTargetsApi.list();
    if ((arg && arg.recalculate) || !targets.calories) {
      try {
        targets = await nutritionTargetsApi.calculate(directionFor(getState().profile.profile.goal));
      } catch (e) {
        // 422: the server profile lacks BMR inputs (birth date, height, weight).
        // Keep whatever targets exist rather than failing the whole load.
        if (!(e instanceof ApiError && e.kind === 'validation')) throw e;
      }
    }
    const calories = targets.calories;
    if (calories) dispatch(setCalorieGoal({ calories: calories.target, source: calories.source }));
    return targets;
  },
);

/** API mode: persists one edited target (on field commit / toggle). Local state was already updated by the reducer. */
export const saveNutritionTargetThunk = createAsyncThunk<
  { key: NutritionTargetKey; target: NutritionTargets[NutritionTargetKey] },
  { key: NutritionTargetKey; target?: number; active?: boolean },
  { state: RootState; rejectValue: string }
>('nutrition/saveTarget', async ({ key, target, active }, { getState, dispatch, rejectWithValue }) => {
  try {
    const saved = await nutritionTargetsApi.save(key, getState().nutrition.serverTargets[key], { target, active });
    if (key === 'calories' && target !== undefined) dispatch(setCalorieGoal({ calories: saved.target, source: 'manual' }));
    return { key, target: saved };
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'The target could not be saved.');
  }
});

export const nutritionTargetsEnabled = !env.useMockApi;

export const loadTodayMeals = createAsyncThunk('nutrition/loadTodayMeals', async (_: void, { getState }) =>
  nutritionRepository.getMealsForDate(selectCurrentUserId(getState() as RootState), new Date().toISOString())
);

export const searchFoodsThunk = createAsyncThunk('nutrition/searchFoods', async (query: string) =>
  nutritionRepository.searchFoods(query)
);

export const loadFavoriteFoods = createAsyncThunk('nutrition/loadFavorites', async (_: void, { getState }) =>
  nutritionRepository.getFavoriteFoods(selectCurrentUserId(getState() as RootState))
);

export const addFoodToMealThunk = createAsyncThunk(
  'nutrition/addFoodToMeal',
  async (input: { mealType: MealType; food: Food; quantity: number }, { getState }) =>
    nutritionRepository.addMealItem({
      userId: selectCurrentUserId(getState() as RootState),
      mealType: input.mealType,
      isoDate: new Date().toISOString(),
      food: input.food,
      quantity: input.quantity,
    })
);

/**
 * Submits every item still pending in the scan session, in one batch call.
 * Items the repository reports as succeeded are removed from the session;
 * failed ones stay so a retry (calling this thunk again) only resends those
 * — never items already saved.
 */
export const saveScanSessionThunk = createAsyncThunk<
  { meals: Meal[]; succeededIds: string[]; failedIds: string[] },
  void,
  { state: RootState; rejectValue: string }
>('nutrition/saveScanSession', async (_, { getState, rejectWithValue }) => {
  const { items } = getState().nutrition.scanSession;
  if (items.length === 0) return { meals: [], succeededIds: [], failedIds: [] };
  try {
    return await nutritionRepository.addMealItems({
      userId: selectCurrentUserId(getState() as RootState),
      isoDate: new Date().toISOString(),
      items: items.map((i) => ({ id: i.id, food: i.food, quantity: i.quantity, mealType: i.mealType })),
    });
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Items could not be saved.');
  }
});

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    setNutritionGoal(state, action: { payload: { key: keyof NutritionGoals; target: number } }) {
      state.goals[action.payload.key].target = action.payload.target;
      state.goals[action.payload.key].source = 'manual';
    },
    toggleNutritionGoal(state, action: { payload: keyof NutritionGoals }) {
      state.goals[action.payload].active = !state.goals[action.payload].active;
    },
    setScanSessionMealType(state, action: { payload: MealType }) {
      state.scanSession.commonMealType = action.payload;
    },
    /** Appends a freshly confirmed scan, or — to merge a repeat barcode — pass `mergeIntoId` instead of letting it push a new row. */
    addScanSessionItem(state, action: { payload: { food: Food; quantity: number; mealType: MealType; mergeIntoId?: string } }) {
      const { food, quantity, mealType, mergeIntoId } = action.payload;
      const existing = mergeIntoId ? state.scanSession.items.find((i) => i.id === mergeIntoId) : undefined;
      if (existing) {
        existing.quantity += quantity;
        return;
      }
      state.scanSession.items.push({ id: generateId('scanitem'), food, quantity, mealType });
    },
    updateScanSessionItem(state, action: { payload: { id: string; quantity?: number; mealType?: MealType } }) {
      const item = state.scanSession.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      if (action.payload.quantity !== undefined) item.quantity = action.payload.quantity;
      if (action.payload.mealType !== undefined) item.mealType = action.payload.mealType;
    },
    removeScanSessionItem(state, action: { payload: string }) {
      state.scanSession.items = state.scanSession.items.filter((i) => i.id !== action.payload);
    },
    clearScanSession(state) {
      state.scanSession = initialScanSession;
    },
  },
  extraReducers: (builder) => {
    builder
      // The Nutrition screen's calorie target follows the computed one - when a profile or onboarding change
      // recalculates it, and when the persisted one is read back on launch - unless the user typed their own
      // target on the Nutrition goals screen (source 'manual'), which is never overwritten.
      .addCase(setCalorieGoal, (state, action) => {
        if (action.payload.source === 'auto' && state.goals.calories.source === 'auto') state.goals.calories.target = action.payload.calories;
      })
      .addCase(hydrateCalorieThunk.fulfilled, (state, action) => {
        if (action.payload.calorieGoalSource === 'auto' && state.goals.calories.source === 'auto') state.goals.calories.target = action.payload.calorieGoal;
      })
      .addCase(loadTodayMeals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadTodayMeals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.todayMeals = action.payload;
      })
      .addCase(loadTodayMeals.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(searchFoodsThunk.pending, (state) => {
        state.searchStatus = 'loading';
      })
      .addCase(searchFoodsThunk.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.searchStatus = action.payload.length ? 'succeeded' : 'empty';
      })
      .addCase(searchFoodsThunk.rejected, (state) => {
        state.searchStatus = 'failed';
      })
      .addCase(loadNutritionTargetsThunk.fulfilled, (state, action) => {
        state.serverTargets = action.payload;
        state.targetsError = null;
        for (const [key, value] of Object.entries(action.payload) as [NutritionTargetKey, NutritionTargets[NutritionTargetKey]][]) {
          if (value) state.goals[key] = { target: value.target, active: value.active, source: value.source };
        }
      })
      .addCase(loadNutritionTargetsThunk.rejected, (state, action) => {
        state.targetsError = action.error.message ?? 'Targets could not be loaded.';
      })
      .addCase(saveNutritionTargetThunk.fulfilled, (state, action) => {
        const value = action.payload.target;
        if (!value) return;
        state.serverTargets[action.payload.key] = value;
        state.goals[action.payload.key] = { target: value.target, active: value.active, source: value.source };
        state.targetsError = null;
      })
      .addCase(saveNutritionTargetThunk.rejected, (state, action) => {
        state.targetsError = action.payload ?? 'The target could not be saved.';
      })
      .addCase(loadFavoriteFoods.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(addFoodToMealThunk.fulfilled, (state, action) => {
        const idx = state.todayMeals.findIndex((m) => m.id === action.payload.id);
        if (idx === -1) state.todayMeals.push(action.payload);
        else state.todayMeals[idx] = action.payload;
      })
      .addCase(saveScanSessionThunk.pending, (state) => {
        state.scanSession.saving = true;
        state.scanSession.error = null;
      })
      .addCase(saveScanSessionThunk.fulfilled, (state, action) => {
        state.scanSession.saving = false;
        for (const meal of action.payload.meals) {
          const idx = state.todayMeals.findIndex((m) => m.id === meal.id);
          if (idx === -1) state.todayMeals.push(meal);
          else state.todayMeals[idx] = meal;
        }
        state.scanSession.items = state.scanSession.items.filter((i) => !action.payload.succeededIds.includes(i.id));
        state.scanSession.error = action.payload.failedIds.length
          ? `${action.payload.failedIds.length} item(s) could not be saved. Tap Save again to retry.`
          : null;
      })
      .addCase(saveScanSessionThunk.rejected, (state, action) => {
        state.scanSession.saving = false;
        state.scanSession.error = action.payload ?? 'Items could not be saved.';
      });
  },
});

export const {
  setNutritionGoal,
  toggleNutritionGoal,
  setScanSessionMealType,
  addScanSessionItem,
  updateScanSessionItem,
  removeScanSessionItem,
  clearScanSession,
} = nutritionSlice.actions;
export default nutritionSlice.reducer;
