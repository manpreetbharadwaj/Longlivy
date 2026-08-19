import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeDashboardScreen } from '@/screens/home/HomeDashboardScreen';
import { HistoryScreen } from '@/screens/home/HistoryScreen';
import { GoalsScreen } from '@/screens/home/GoalsScreen';
import { NotificationsScreen } from '@/screens/home/NotificationsScreen';
import { ProfileScreen } from '@/screens/home/ProfileScreen';
import { EditProfileScreen } from '@/screens/home/EditProfileScreen';
import { SettingsScreen } from '@/screens/home/SettingsScreen';
import { HealthIntegrationsScreen } from '@/screens/home/HealthIntegrationsScreen';
import { PrivacyScreen } from '@/screens/home/PrivacyScreen';
import { DataManagementScreen } from '@/screens/home/DataManagementScreen';
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
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="HealthIntegrations" component={HealthIntegrationsScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="DataManagement" component={DataManagementScreen} />
    <Stack.Screen name="EnterWeight" component={EnterWeightScreen} />
  </Stack.Navigator>
);
