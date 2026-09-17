import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from './types';
import { ProfileScreen } from '@/screens/home/ProfileScreen';
import { EditProfileScreen } from '@/screens/home/EditProfileScreen';
import { SettingsScreen } from '@/screens/home/SettingsScreen';
import { HealthIntegrationsScreen } from '@/screens/home/HealthIntegrationsScreen';
import { NoiseDeviceScreen } from '@/screens/home/NoiseDeviceScreen';
import { PrivacyScreen } from '@/screens/home/PrivacyScreen';
import { DataManagementScreen } from '@/screens/home/DataManagementScreen';
import { FeedbackScreen } from '@/screens/home/FeedbackScreen';
import { withErrorBoundary } from '@/components/hoc/withErrorBoundary';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const Profile = withErrorBoundary(ProfileScreen, 'Profile');
// Wrapped defensively — this screen renders a lot of live BLE-derived data
// (packet stats, dynamically shaped vendor payloads); an error boundary
// means a rendering bug here degrades to a recoverable error screen
// instead of taking down the whole app.
const NoiseDevice = withErrorBoundary(NoiseDeviceScreen, 'NoiseDevice');

export const ProfileNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="HealthIntegrations" component={HealthIntegrationsScreen} />
    <Stack.Screen name="NoiseDevice" component={NoiseDevice} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="DataManagement" component={DataManagementScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
  </Stack.Navigator>
);
