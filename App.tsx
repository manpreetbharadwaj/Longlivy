import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';

import { store } from '@/store/store';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppPreferencesProvider } from '@/contexts/AppPreferencesContext';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { withErrorBoundary } from '@/components/hoc/withErrorBoundary';

const RootNavigatorSafe = withErrorBoundary(RootNavigator, 'Longlivy');

const NavigationRoot: React.FC = () => {
  const { theme } = useTheme();

  const navigationTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigatorSafe />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <ThemeProvider>
            <AppPreferencesProvider>
              <OnboardingProvider>
                <NavigationRoot />
              </OnboardingProvider>
            </AppPreferencesProvider>
          </ThemeProvider>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
