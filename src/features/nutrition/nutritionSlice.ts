import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Food, Meal, MealType, NutritionGoals } from './models';
import { nutritionRepository } from './repository/MockNutritionRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { hydrateCalorieThunk, setCalorieGoal } from '@/features/calories/calorieSlice';

interface NutritionState {
  todayMeals: Meal[];
  searchResults: Food[];
  favorites: Food[];
  goals: NutritionGoals;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  searchStatus: 'idle' | 'loading' | 'succeeded' | 'failed' | 'empty';
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
};

export const loadTodayMeals = createAsyncThunk('nutrition/loadTodayMeals', async () =>
  nutritionRepository.getMealsForDate(DEMO_USER_ID, new Date().toISOString())
);

export const searchFoodsThunk = createAsyncThunk('nutrition/searchFoods', async (query: string) =>
  nutritionRepository.searchFoods(query)
);

export const loadFavoriteFoods = createAsyncThunk('nutrition/loadFavorites', async () =>
  nutritionRepository.getFavoriteFoods(DEMO_USER_ID)
);

export const addFoodToMealThunk = createAsyncThunk(
  'nutrition/addFoodToMeal',
  async (input: { mealType: MealType; food: Food; quantity: number }) =>
    nutritionRepository.addMealItem({
      userId: DEMO_USER_ID,
      mealType: input.mealType,
      isoDate: new Date().toISOString(),
      food: input.food,
      quantity: input.quantity,
    })
);

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
      .addCase(loadFavoriteFoods.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(addFoodToMealThunk.fulfilled, (state, action) => {
        const idx = state.todayMeals.findIndex((m) => m.id === action.payload.id);
        if (idx === -1) state.todayMeals.push(action.payload);
        else state.todayMeals[idx] = action.payload;
      });
  },
});

export const { setNutritionGoal, toggleNutritionGoal } = nutritionSlice.actions;
export default nutritionSlice.reducer;
