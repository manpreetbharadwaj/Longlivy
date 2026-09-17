import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeDashboardScreen } from '@/screens/home/HomeDashboardScreen';
import { HistoryScreen } from '@/screens/home/HistoryScreen';
import { GoalsScreen } from '@/screens/home/GoalsScreen';
import { NotificationsScreen } from '@/screens/home/NotificationsScreen';
import { EnterWeightScreen } from '@/screens/home/EnterWeightScreen';
import { withErrorBoundary } from '@/components/hoc/withErrorBoundary';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeDashboard = withErrorBoundary(HomeDashboardScreen, 'Dashboard');

export const HomeNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeDashboard" component={HomeDashboard} />
    <Stack.Screen name="History" component={HistoryScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="EnterWeight" component={EnterWeightScreen} />
  </Stack.Navigator>
);
