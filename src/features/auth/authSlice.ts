import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AuthSession, RegisterInput } from './models';
import { authRepository } from './repository';

interface AuthState {
  session: AuthSession | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  bootstrapped: boolean;
  onboardingComplete: boolean;
}

const initialState: AuthState = {
  session: null,
  status: 'idle',
  error: null,
  bootstrapped: false,
  onboardingComplete: false,
};

/**
 * Reads persisted session + onboarding status together on app launch, so a
 * returning user (or one right after "delete all my data") lands on the
 * correct screen on the very first render — never bounced back through
 * onboarding just because that flag wasn't checked yet.
 */
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async () => {
  const [session, onboardingComplete] = await Promise.all([
    authRepository.getCurrentSession(),
    authRepository.getOnboardingComplete(),
  ]);
  return { session, onboardingComplete };
});

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const session = await authRepository.login(input.email, input.password);
      // A successful login means this is a returning, already-known user —
      // onboarding (the personalization/marketing flow for new users) has
      // no reason to show again on a future launch just because a session
      // was cleared. Persisted here (not only in Redux state) so it holds
      // across app restarts, the same way `completeOnboardingThunk` does.
      await authRepository.setOnboardingComplete(true);
      return session;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Login failed');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (input: RegisterInput, { rejectWithValue }) => {
    try {
      const session = await authRepository.register(input);
      await authRepository.setOnboardingComplete(true);
      return session;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Registration failed');
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => authRepository.logout());

/** Marks onboarding complete for this device and persists it — the whole point being it's asked once, not every launch. */
export const completeOnboardingThunk = createAsyncThunk('auth/completeOnboarding', async () => {
  await authRepository.setOnboardingComplete(true);
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setOnboardingComplete(state, action: { payload: boolean }) {
      state.onboardingComplete = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.session = action.payload.session;
        state.onboardingComplete = action.payload.onboardingComplete;
        state.bootstrapped = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.bootstrapped = true;
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload;
        state.onboardingComplete = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Login failed';
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.session = action.payload;
        state.onboardingComplete = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Registration failed';
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.session = null;
      })
      .addCase(completeOnboardingThunk.fulfilled, (state) => {
        state.onboardingComplete = true;
      });
  },
});

export const { setOnboardingComplete } = authSlice.actions;
export default authSlice.reducer;
