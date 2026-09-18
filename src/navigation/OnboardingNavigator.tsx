import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { GoalSelectScreen } from '@/screens/onboarding/GoalSelectScreen';
import { PrimaryGoalScreen } from '@/screens/onboarding/PrimaryGoalScreen';
import { ChooseGoalScreen } from '@/screens/onboarding/ChooseGoalScreen';
import { PersonalizeMeScreen } from '@/screens/onboarding/PersonalizeMeScreen';
import { GenderStepScreen } from '@/screens/onboarding/GenderStepScreen';
import { AgeStepScreen } from '@/screens/onboarding/AgeStepScreen';
import { HeightStepScreen } from '@/screens/onboarding/HeightStepScreen';
import { WeightStepScreen } from '@/screens/onboarding/WeightStepScreen';
import { ActivityLevelStepScreen } from '@/screens/onboarding/ActivityLevelStepScreen';
import { GoalQuestionScreen } from '@/screens/onboarding/GoalQuestionScreen';
import { MicronutrientSetupScreen } from '@/screens/onboarding/MicronutrientSetupScreen';
import { GoalSummaryScreen } from '@/screens/onboarding/GoalSummaryScreen';
import { CompleteSetupScreen } from '@/screens/onboarding/CompleteSetupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Welcome (what is HealthyMe) → GoalSelect ("why are you here" — multi-select
 * focus areas) → PrimaryGoal (only if more than one was selected) → Goal
 * (the existing weight-direction beat — "understanding HealthyMe" becomes
 * "building my personal profile"; asked exactly once, before any personal
 * info) → the six numbered "Essential Common Information" steps
 * (PersonalizeMe → Gender → Age[DOB] → Height → Weight → ActivityLevelStep)
 * → a dynamically-generated sequence of goal-specific screens (GoalQuestion,
 * pushed once per question in the user's generated flow — see
 * `useGoalFlow`/`buildGoalFlow` in `features/onboarding/goals/`; Nutrition's
 * flow ends with the existing Micronutrients screen instead of a generic
 * question) → GoalSummary (the goal-focused recap) → CompleteSetup
 * (the real calorie-plan calibration, then hand off to account creation).
 *
 * GoalQuestion is the one route in this stack that's reached many times
 * with different params in a single flow — every screen navigates to it via
 * `navigation.push`, never `navigate`, so each question is a real, distinct
 * stack entry and Back always steps to the *previous* question.
 *
 * Activity level rejoined the stack (Common step 6 of 6, right after Weight)
 * on request — reusing ActivityLevelStepScreen's existing design/component
 * untouched, just repointed at its new neighbors. Goal is intentionally
 * *not* duplicated here — it stays in its single, earlier position per the
 * original requirement that goal come before any personal info; only
 * Activity Level was reinstated. Slide transitions + swipe-back throughout
 * so the flow reads as one continuous journey instead of a stack of
 * hard-cut form pages.
 */
export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="GoalSelect" component={GoalSelectScreen} />
    <Stack.Screen name="PrimaryGoal" component={PrimaryGoalScreen} />
    <Stack.Screen name="Goal" component={ChooseGoalScreen} />
    <Stack.Screen name="PersonalizeMe" component={PersonalizeMeScreen} />
    <Stack.Screen name="Gender" component={GenderStepScreen} />
    <Stack.Screen name="Age" component={AgeStepScreen} />
    <Stack.Screen name="Height" component={HeightStepScreen} />
    <Stack.Screen name="Weight" component={WeightStepScreen} />
    <Stack.Screen name="ActivityLevelStep" component={ActivityLevelStepScreen} />
    <Stack.Screen name="GoalQuestion" component={GoalQuestionScreen} />
    <Stack.Screen name="Micronutrients" component={MicronutrientSetupScreen} />
    <Stack.Screen name="GoalSummary" component={GoalSummaryScreen} />
    <Stack.Screen name="CompleteSetup" component={CompleteSetupScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);
