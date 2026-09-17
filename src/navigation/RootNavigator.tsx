import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '@/screens/SplashScreen';
import { LanguageSelectScreen } from '@/screens/onboarding/LanguageSelectScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapSession } from '@/features/auth/authSlice';
import { selectAuthBootstrapped, selectIsAuthenticated, selectOnboardingComplete } from '@/features/auth/selectors';
import { hydrateProfileThunk } from '@/features/profile/profileSlice';
import { selectHasAddress, selectProfileHydrated } from '@/features/profile/selectors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MIN_SPLASH_MS = 900;

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const bootstrapped = useAppSelector(selectAuthBootstrapped);
  const profileHydrated = useAppSelector(selectProfileHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const onboardingComplete = useAppSelector(selectOnboardingComplete);
  const hasAddress = useAppSelector(selectHasAddress);
  const { hydrated: prefsHydrated, preferences } = useAppPreferences();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    dispatch(bootstrapSession());
    // Alongside auth's own bootstrap, not after it — the profile's
    // persisted address (see profileRepository) needs to be in place
    // before `hasAddress` is ever evaluated below, or a returning user
    // with a real saved address would flash through AddressStepScreen
    // again on every cold launch, judged against the fresh-process
    // DEMO_USER default for the instant before hydration resolves.
    dispatch(hydrateProfileThunk());
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // `prefsHydrated` joins the splash gate so the persisted language is in
  // place before the first user-facing screen renders — no English→German
  // flash. AsyncStorage resolves in ~10–50ms, well inside MIN_SPLASH_MS.
  const showSplash = !bootstrapped || !profileHydrated || !prefsHydrated || !minTimeElapsed;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showSplash ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : !preferences.languageSelected ? (
        // First launch only — pick a language before anything else.
        <Stack.Screen name="Language" component={LanguageSelectScreen} />
      ) : !onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !isAuthenticated || !hasAddress ? (
        // Not authenticated → the Login/Register/ForgotPassword flow.
        // Authenticated but no address on file yet → the same stack, but
        // AuthNavigator opens straight on `Address` instead of `Login` in
        // that case (see its own initialRouteName logic) rather than
        // asking an already-signed-in user to log in again.
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
