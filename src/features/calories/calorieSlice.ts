import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BodyProfile } from './models';
import { DEMO_USER } from '@/mock/demoUser';

interface CalorieState {
  calorieGoal: number;
  calorieGoalSource: 'auto' | 'manual';
  bodyProfile: BodyProfile;
}

function ageFromDob(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const initialState: CalorieState = {
  calorieGoal: 2200,
  calorieGoalSource: 'auto',
  bodyProfile: {
    age: ageFromDob(DEMO_USER.dateOfBirth),
    gender: DEMO_USER.gender === 'diverse' ? 'diverse' : DEMO_USER.gender,
    heightCm: DEMO_USER.heightCm,
    weightKg: DEMO_USER.weightKg,
    activityLevel: DEMO_USER.activityLevel,
  },
};

const calorieSlice = createSlice({
  name: 'calorie',
  initialState,
  reducers: {
    setCalorieGoal(state, action: PayloadAction<number>) {
      state.calorieGoal = action.payload;
      state.calorieGoalSource = 'manual';
    },
    setBodyProfile(state, action: PayloadAction<Partial<BodyProfile>>) {
      state.bodyProfile = { ...state.bodyProfile, ...action.payload };
    },
  },
});

export const { setCalorieGoal, setBodyProfile } = calorieSlice.actions;
export default calorieSlice.reducer;
