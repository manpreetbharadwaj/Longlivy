import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FastingStackParamList } from './types';
import { FastingHomeScreen } from '@/screens/fasting/FastingHomeScreen';
import { SelectFastingMethodScreen } from '@/screens/fasting/SelectFastingMethodScreen';
import { CustomFastingScreen } from '@/screens/fasting/CustomFastingScreen';
import { CreateFastingPlanScreen } from '@/screens/fasting/CreateFastingPlanScreen';
import { FastingPlansScreen } from '@/screens/fasting/FastingPlansScreen';
import { FastingStartedScreen } from '@/screens/fasting/FastingStartedScreen';
import { ActiveFastScreen } from '@/screens/fasting/ActiveFastScreen';
import { FastSummaryScreen } from '@/screens/fasting/FastSummaryScreen';
import { FastingHistoryScreen } from '@/screens/fasting/FastingHistoryScreen';
import { FastingCalendarScreen } from '@/screens/fasting/FastingCalendarScreen';
import { FastingStatisticsScreen } from '@/screens/fasting/FastingStatisticsScreen';
import { FastingSettingsScreen } from '@/screens/fasting/FastingSettingsScreen';

const Stack = createNativeStackNavigator<FastingStackParamList>();

export const FastingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FastingHome" component={FastingHomeScreen} />
    <Stack.Screen name="SelectFastingMethod" component={SelectFastingMethodScreen} />
    <Stack.Screen name="CustomFasting" component={CustomFastingScreen} />
    <Stack.Screen name="CreateFastingPlan" component={CreateFastingPlanScreen} />
    <Stack.Screen name="FastingPlans" component={FastingPlansScreen} />
    <Stack.Screen name="FastingStarted" component={FastingStartedScreen} />
    <Stack.Screen name="ActiveFast" component={ActiveFastScreen} />
    <Stack.Screen name="FastSummary" component={FastSummaryScreen} />
    <Stack.Screen name="FastingHistory" component={FastingHistoryScreen} />
    <Stack.Screen name="FastingCalendar" component={FastingCalendarScreen} />
    <Stack.Screen name="FastingStatistics" component={FastingStatisticsScreen} />
    <Stack.Screen name="FastingSettings" component={FastingSettingsScreen} />
  </Stack.Navigator>
);
