import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BodyProfile } from './models';
import { DEMO_USER } from '@/mock/demoUser';

interface CalorieState {
  calorieGoal: number;
  calorieGoalSource: 'auto' | 'manual';
  /** Which BMR strategy produced `calorieGoal` when `calorieGoalSource === 'auto'` — e.g. `{ method: 'Mifflin-St Jeor', version: '1.0' }` from `CalorieCalculationEngine`. Undefined for a manually-entered goal, where no calculation method applies. Exists specifically to satisfy the requirement that any auto-calculated target record which method/version produced it. */
  calculationMethod?: string;
  calculationVersion?: string;
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

interface SetCalorieGoalPayload {
  calories: number;
  /** Was this typed in by the user, or produced by `CalorieCalculationEngine`? Previously this reducer hardcoded 'manual' unconditionally — even for onboarding's own auto-calculated goal — which silently mis-tagged every user's initial target. */
  source: 'auto' | 'manual';
  calculationMethod?: string;
  calculationVersion?: string;
}

const calorieSlice = createSlice({
  name: 'calorie',
  initialState,
  reducers: {
    setCalorieGoal(state, action: PayloadAction<SetCalorieGoalPayload>) {
      state.calorieGoal = action.payload.calories;
      state.calorieGoalSource = action.payload.source;
      state.calculationMethod = action.payload.source === 'auto' ? action.payload.calculationMethod : undefined;
      state.calculationVersion = action.payload.source === 'auto' ? action.payload.calculationVersion : undefined;
    },
    setBodyProfile(state, action: PayloadAction<Partial<BodyProfile>>) {
      state.bodyProfile = { ...state.bodyProfile, ...action.payload };
    },
  },
});

export const { setCalorieGoal, setBodyProfile } = calorieSlice.actions;
export default calorieSlice.reducer;
