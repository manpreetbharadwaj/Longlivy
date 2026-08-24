import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ValueScreen } from '@/screens/onboarding/ValueScreen';
import { GenderStepScreen } from '@/screens/onboarding/GenderStepScreen';
import { AgeStepScreen } from '@/screens/onboarding/AgeStepScreen';
import { HeightStepScreen } from '@/screens/onboarding/HeightStepScreen';
import { WeightStepScreen } from '@/screens/onboarding/WeightStepScreen';
import { ActivityLevelStepScreen } from '@/screens/onboarding/ActivityLevelStepScreen';
import { TrainingDetailsStepScreen } from '@/screens/onboarding/TrainingDetailsStepScreen';
import { ChooseGoalScreen } from '@/screens/onboarding/ChooseGoalScreen';
import { GoalPaceStepScreen } from '@/screens/onboarding/GoalPaceStepScreen';
import { FastingPreferenceStepScreen } from '@/screens/onboarding/FastingPreferenceStepScreen';
import { CompleteSetupScreen } from '@/screens/onboarding/CompleteSetupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Welcome (introduce) → Value (show value) → nine personalization steps
 * (Gender → Age[DOB] → Height → Weight → Activity → Training → Goal →
 * GoalPace[skipped for maintenance] → FastingPreference) → CompleteSetup
 * (calibrate, then hand off to account creation). Slide transitions +
 * swipe-back throughout so the flow reads as one continuous journey
 * instead of a stack of hard-cut form pages.
 */
export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Value" component={ValueScreen} />
    <Stack.Screen name="Gender" component={GenderStepScreen} />
    <Stack.Screen name="Age" component={AgeStepScreen} />
    <Stack.Screen name="Height" component={HeightStepScreen} />
    <Stack.Screen name="Weight" component={WeightStepScreen} />
    <Stack.Screen name="ActivityLevelStep" component={ActivityLevelStepScreen} />
    <Stack.Screen name="TrainingDetails" component={TrainingDetailsStepScreen} />
    <Stack.Screen name="ChooseGoal" component={ChooseGoalScreen} />
    <Stack.Screen name="GoalPace" component={GoalPaceStepScreen} />
    <Stack.Screen name="FastingPreference" component={FastingPreferenceStepScreen} />
    <Stack.Screen name="CompleteSetup" component={CompleteSetupScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);
