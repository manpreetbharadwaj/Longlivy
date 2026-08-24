import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { AddressStepScreen } from '@/screens/auth/AddressStepScreen';
import { EmailVerificationScreen } from '@/screens/auth/EmailVerificationScreen';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/selectors';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Opens on `Address` instead of `Login` when already authenticated —
 * `registerThunk` sets `session` synchronously on success, so the only way
 * a signed-in-but-address-missing user (RootNavigator's other condition for
 * staying in this stack) reaches the field they still owe is by landing
 * here directly, not by ever seeing the login form again.
 */
export const AuthNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Stack.Navigator initialRouteName={isAuthenticated ? 'Address' : 'Login'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Address" component={AddressStepScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
};
