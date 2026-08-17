import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapSession } from '@/features/auth/authSlice';
import { selectAuthBootstrapped, selectIsAuthenticated, selectOnboardingComplete } from '@/features/auth/selectors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const MIN_SPLASH_MS = 900;

export const RootNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const bootstrapped = useAppSelector(selectAuthBootstrapped);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const onboardingComplete = useAppSelector(selectOnboardingComplete);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    dispatch(bootstrapSession());
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const showSplash = !bootstrapped || !minTimeElapsed;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showSplash ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : !onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
