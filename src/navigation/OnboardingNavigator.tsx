import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ValueScreen } from '@/screens/onboarding/ValueScreen';
import { ChooseGoalScreen } from '@/screens/onboarding/ChooseGoalScreen';
import { PersonalizeMeScreen } from '@/screens/onboarding/PersonalizeMeScreen';
import { GenderStepScreen } from '@/screens/onboarding/GenderStepScreen';
import { AgeStepScreen } from '@/screens/onboarding/AgeStepScreen';
import { HeightStepScreen } from '@/screens/onboarding/HeightStepScreen';
import { WeightStepScreen } from '@/screens/onboarding/WeightStepScreen';
import { ActivityLevelStepScreen } from '@/screens/onboarding/ActivityLevelStepScreen';
import { MicronutrientSetupScreen } from '@/screens/onboarding/MicronutrientSetupScreen';
import { CompleteSetupScreen } from '@/screens/onboarding/CompleteSetupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Welcome (what is Long Livy) → Value (application introduction) → Goal
 * (the transition beat — "understanding Long Livy" becomes "building my
 * personal profile"; asked exactly once, before any personal info) → the
 * seven numbered personalization steps (PersonalizeMe → Gender → Age[DOB] →
 * Height → Weight → ActivityLevelStep → Micronutrients) → CompleteSetup
 * (calibrate, then hand off to account creation).
 *
 * Activity level rejoined the stack (Step 6 of 7, right after Weight) on
 * request — reusing ActivityLevelStepScreen's existing design/component
 * untouched, just repointed at its new neighbors. Goal is intentionally
 * *not* duplicated here — it stays in its single, earlier position per the
 * original requirement that goal come before any personal info; only
 * Activity Level was reinstated. Training frequency/volume, weight-change
 * pace and fasting method are still not asked — see OnboardingContext's
 * class doc — and there is no separate "how do you train?" or "how do you
 * want to fast?" screen. Slide transitions + swipe-back throughout so the
 * flow reads as one continuous journey instead of a stack of hard-cut form
 * pages.
 */
export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Value" component={ValueScreen} />
    <Stack.Screen name="Goal" component={ChooseGoalScreen} />
    <Stack.Screen name="PersonalizeMe" component={PersonalizeMeScreen} />
    <Stack.Screen name="Gender" component={GenderStepScreen} />
    <Stack.Screen name="Age" component={AgeStepScreen} />
    <Stack.Screen name="Height" component={HeightStepScreen} />
    <Stack.Screen name="Weight" component={WeightStepScreen} />
    <Stack.Screen name="ActivityLevelStep" component={ActivityLevelStepScreen} />
    <Stack.Screen name="Micronutrients" component={MicronutrientSetupScreen} />
    <Stack.Screen name="CompleteSetup" component={CompleteSetupScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);
