import React, { useEffect, useRef, useState } from 'react';
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
import { selectAuthBootstrapped, selectAuthSession, selectAuthUser, selectIsAuthenticated, selectOnboardingComplete } from '@/features/auth/selectors';
import { hydrateProfileThunk, updateProfile } from '@/features/profile/profileSlice';
import { hydrateCalorieThunk, setBodyProfile } from '@/features/calories/calorieSlice';
import { hydrateNotificationSettingsThunk } from '@/features/notifications/notificationSlice';
import { selectHasAddress, selectProfileHydrated } from '@/features/profile/selectors';
import { API_PROFILE_DEFAULT } from '@/features/profile/repository';
import { fromServerActivityLevel } from '@/services/api/profileApi';
import { env } from '@/config/env';
import type { DemoUserProfile } from '@/mock/demoUser';
import { syncProfileWithRetry } from '@/features/auth/repository/ApiAuthRepository';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MIN_SPLASH_MS = 900;

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const bootstrapped = useAppSelector(selectAuthBootstrapped);
  const profileHydrated = useAppSelector(selectProfileHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authUser = useAppSelector(selectAuthUser);
  const authSession = useAppSelector(selectAuthSession);
  const onboardingComplete = useAppSelector(selectOnboardingComplete);
  const hasAddress = useAppSelector(selectHasAddress);
  const { hydrated: prefsHydrated, preferences, setLanguage } = useAppPreferences();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const languageUserRef = useRef<string | null>(null);
  const hydratingLanguageRef = useRef(false);

  useEffect(() => {
    dispatch(bootstrapSession());
    // Alongside auth's own bootstrap, not after it — the profile's
    // persisted address (see profileRepository) needs to be in place
    // before `hasAddress` is ever evaluated below, or a returning user
    // with a real saved address would flash through AddressStepScreen
    // again on every cold launch, judged against the fresh-process
    // DEMO_USER default for the instant before hydration resolves.
    dispatch(hydrateProfileThunk());
    dispatch(hydrateCalorieThunk());
    dispatch(hydrateNotificationSettingsThunk());
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const profileId = useAppSelector((state) => state.profile.profile.id);
  useEffect(() => {
    if (!authUser) return;
    // A different account than the one whose profile is stored on this
    // device starts from a blank profile — never another user's local fields.
    // An empty stored id is a profile filled in during onboarding before this
    // account existed — it belongs to this user and must be kept.
    const base = !env.useMockApi && profileId && profileId !== authUser.id ? API_PROFILE_DEFAULT : {};
    // Server profile values (GET /auth/me, login, register) win over local ones.
    const server = authSession?.serverProfile;
    const fromServer: Partial<DemoUserProfile> = server
      ? {
          ...(server.dateOfBirth ? { dateOfBirth: server.dateOfBirth } : {}),
          ...(server.gender === 'female' || server.gender === 'male' || server.gender === 'diverse' ? { gender: server.gender as DemoUserProfile['gender'] } : {}),
          ...(server.heightCm != null ? { heightCm: server.heightCm } : {}),
          ...(server.weightKg != null ? { weightKg: server.weightKg } : {}),
          ...(server.address ? { address: server.address } : {}),
          ...(fromServerActivityLevel(server.activityLevel) ? { activityLevel: fromServerActivityLevel(server.activityLevel) } : {}),
          ...(server.goal ? { goal: server.goal, goalSource: 'user' as const } : {}),
          ...(server.weightChangePaceKgPerWeek != null ? { weightChangePaceKgPerWeek: server.weightChangePaceKgPerWeek } : {}),
          ...(server.trainingFrequency != null ? { trainingFrequency: server.trainingFrequency } : {}),
          ...(server.trainingVolume ? { trainingVolume: server.trainingVolume } : {}),
          ...(server.fastingMethod ? { fastingMethod: server.fastingMethod as DemoUserProfile['fastingMethod'] } : {}),
          ...(server.micronutrientFocus != null ? { micronutrientFocus: server.micronutrientFocus } : {}),
          ...(server.avatarId ? { avatarId: server.avatarId } : {}),
        }
      : {};
    dispatch(updateProfile({ ...base, ...fromServer, id: authUser.id, firstName: authUser.firstName, lastName: authUser.lastName, email: authUser.email }));
    // The energy engine (BMR/NRLA) reads its own body profile — seed it from the
    // server so a signed-in user's numbers never start from the demo defaults.
    if (!env.useMockApi && server) {
      const age = server.dateOfBirth ? Math.floor((Date.now() - new Date(server.dateOfBirth).getTime()) / (365.25 * 86_400_000)) : undefined;
      dispatch(
        setBodyProfile({
          ...(age !== undefined && Number.isFinite(age) ? { age } : {}),
          ...(fromServer.gender ? { gender: fromServer.gender } : {}),
          ...(fromServer.heightCm ? { heightCm: fromServer.heightCm } : {}),
          ...(fromServer.weightKg ? { weightKg: fromServer.weightKg } : {}),
          ...(fromServer.activityLevel ? { activityLevel: fromServer.activityLevel } : {}),
        }),
      );
    }
    // profileId is read only to detect an account switch; re-running on its change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authSession, dispatch]);

  const serverLanguage = authSession?.serverProfile?.language;
  useEffect(() => {
    if (env.useMockApi) return;
    if (!authUser || languageUserRef.current === authUser.id) return;
    languageUserRef.current = authUser.id;
    if (serverLanguage && serverLanguage !== preferences.language) {
      hydratingLanguageRef.current = true;
      setLanguage(serverLanguage);
    }
  }, [authUser, serverLanguage, preferences.language, setLanguage]);

  useEffect(() => {
    if (env.useMockApi) return;
    if (!authUser || languageUserRef.current !== authUser.id) return;
    if (hydratingLanguageRef.current) {
      if (preferences.language === serverLanguage) hydratingLanguageRef.current = false;
      return;
    }
    if (preferences.language !== serverLanguage) {
      syncProfileWithRetry(authUser.id, { language: preferences.language }).catch(() => undefined);
    }
  }, [authUser, preferences.language, serverLanguage]);

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
