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

  // React Navigation's own screen wrapper (`Background`, from
  // @react-navigation/elements) paints every screen — and the space around
  // any transparent-margin custom component like FloatingTabBar — with
  // `colors.background` from this theme as a base layer, at every navigator
  // level (root stack, tab navigator, each nested stack). That's a fallback
  // layer, not a deliberate surface — every screen already paints its own
  // opaque background, so this layer should never be visibly painted at
  // all. Explicitly transparent (not a hardcoded color match) so the
  // floating tab bar's intentional gaps show whatever's genuinely behind
  // them (the native root view, already dark per app.json's splash
  // backgroundColor) rather than a flat rectangle that would mismatch the
  // instant any screen's own background differs even slightly.
  const navigationTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: 'transparent',
      card: 'transparent',
      text: '#FFFFFF',
      border: 'rgba(255,255,255,0.12)',
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
