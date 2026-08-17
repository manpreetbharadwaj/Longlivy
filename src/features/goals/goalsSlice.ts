import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Goal } from './models';
import { DEMO_USER_ID } from '@/mock/demoUser';

interface GoalsState {
  goals: Goal[];
}

const initialState: GoalsState = {
  goals: [
    { id: 'goal_calories', userId: DEMO_USER_ID, type: 'calories', target: 2200, unit: 'kcal', period: 'day', active: true, source: 'auto' },
    { id: 'goal_protein', userId: DEMO_USER_ID, type: 'protein', target: 150, unit: 'g', period: 'day', active: true, source: 'auto' },
    { id: 'goal_fasting', userId: DEMO_USER_ID, type: 'fasting_hours', target: 16, unit: 'h', period: 'day', active: true, source: 'auto' },
    { id: 'goal_activity', userId: DEMO_USER_ID, type: 'activity_minutes', target: 30, unit: 'min', period: 'day', active: true, source: 'auto' },
    { id: 'goal_meditation', userId: DEMO_USER_ID, type: 'meditation_minutes', target: 10, unit: 'min', period: 'day', active: true, source: 'auto' },
    { id: 'goal_meditation_weekly', userId: DEMO_USER_ID, type: 'meditation_sessions', target: 5, unit: 'sessions', period: 'week', active: true, source: 'manual' },
  ],
};

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    upsertGoal(state, action: PayloadAction<Goal>) {
      const idx = state.goals.findIndex((g) => g.id === action.payload.id);
      if (idx === -1) state.goals.push(action.payload);
      else state.goals[idx] = action.payload;
    },
    toggleGoal(state, action: PayloadAction<string>) {
      const goal = state.goals.find((g) => g.id === action.payload);
      if (goal) goal.active = !goal.active;
    },
    removeGoal(state, action: PayloadAction<string>) {
      state.goals = state.goals.filter((g) => g.id !== action.payload);
    },
  },
});

export const { upsertGoal, toggleGoal, removeGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
