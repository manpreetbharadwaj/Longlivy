import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { WhatIsLonglivyScreen } from '@/screens/onboarding/WhatIsLonglivyScreen';
import { TrackingOverviewScreen } from '@/screens/onboarding/TrackingOverviewScreen';
import { ChooseGoalScreen } from '@/screens/onboarding/ChooseGoalScreen';
import { PersonalInfoScreen } from '@/screens/onboarding/PersonalInfoScreen';
import { ActivityLevelStepScreen } from '@/screens/onboarding/ActivityLevelStepScreen';
import { NutritionGoalsStepScreen } from '@/screens/onboarding/NutritionGoalsStepScreen';
import { FastingPreferenceStepScreen } from '@/screens/onboarding/FastingPreferenceStepScreen';
import { MeditationPreferenceStepScreen } from '@/screens/onboarding/MeditationPreferenceStepScreen';
import { NotificationPreferenceStepScreen } from '@/screens/onboarding/NotificationPreferenceStepScreen';
import { CompleteSetupScreen } from '@/screens/onboarding/CompleteSetupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="WhatIsLonglivy" component={WhatIsLonglivyScreen} />
    <Stack.Screen name="TrackingOverview" component={TrackingOverviewScreen} />
    <Stack.Screen name="ChooseGoal" component={ChooseGoalScreen} />
    <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
    <Stack.Screen name="ActivityLevelStep" component={ActivityLevelStepScreen} />
    <Stack.Screen name="NutritionGoalsStep" component={NutritionGoalsStepScreen} />
    <Stack.Screen name="FastingPreferenceStep" component={FastingPreferenceStepScreen} />
    <Stack.Screen name="MeditationPreferenceStep" component={MeditationPreferenceStepScreen} />
    <Stack.Screen name="NotificationPreferenceStep" component={NotificationPreferenceStepScreen} />
    <Stack.Screen name="CompleteSetup" component={CompleteSetupScreen} />
  </Stack.Navigator>
);
