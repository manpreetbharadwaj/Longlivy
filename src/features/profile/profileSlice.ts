import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEMO_USER, DemoUserProfile } from '@/mock/demoUser';

interface ProfileState {
  profile: DemoUserProfile;
}

const initialState: ProfileState = { profile: DEMO_USER };

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<DemoUserProfile>>) {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
});

export const { updateProfile } = profileSlice.actions;
export default profileSlice.reducer;
