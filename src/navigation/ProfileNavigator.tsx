import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '@/screens/home/ProfileScreen';
import { EditProfileScreen } from '@/screens/home/EditProfileScreen';
import { SettingsScreen } from '@/screens/home/SettingsScreen';
import { HealthIntegrationsScreen } from '@/screens/home/HealthIntegrationsScreen';
import { PrivacyScreen } from '@/screens/home/PrivacyScreen';
import { DataManagementScreen } from '@/screens/home/DataManagementScreen';
import { FeedbackScreen } from '@/screens/home/FeedbackScreen';
import { withErrorBoundary } from '@/components/hoc/withErrorBoundary';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const Profile = withErrorBoundary(ProfileScreen, 'Profile');

export const ProfileNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="HealthIntegrations" component={HealthIntegrationsScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="DataManagement" component={DataManagementScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
  </Stack.Navigator>
);
