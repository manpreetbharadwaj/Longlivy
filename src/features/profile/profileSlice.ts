import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEMO_USER, DemoUserProfile } from '@/mock/demoUser';
import { profileRepository } from './repository';

interface ProfileState {
  profile: DemoUserProfile;
  /** True once `hydrateProfileThunk` has resolved (or failed) — mirrors `auth.bootstrapped`, so RootNavigator can wait for the real persisted profile (address included) before evaluating `selectHasAddress`, instead of briefly judging it against the fresh-launch `DEMO_USER` default. */
  hydrated: boolean;
}

const initialState: ProfileState = { profile: DEMO_USER, hydrated: false };

/** Reads the persisted profile (see `repository.ts`) on app launch — call this alongside `bootstrapSession`. */
export const hydrateProfileThunk = createAsyncThunk('profile/hydrate', async () => profileRepository.get());

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<DemoUserProfile>>) {
      state.profile = { ...state.profile, ...action.payload };
      // Fire-and-forget: reducers must stay synchronous, so this can't
      // `await` the write, but `profileRepository.save` is a best-effort
      // AsyncStorage call (see LocalStore) — a failure here just means the
      // next launch falls back to the last successfully-persisted profile,
      // not a crash or a blocked update.
      profileRepository.save(state.profile).catch(() => {});
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.hydrated = true;
      })
      .addCase(hydrateProfileThunk.rejected, (state) => {
        state.hydrated = true;
      });
  },
});

export const { updateProfile } = profileSlice.actions;
export default profileSlice.reducer;
