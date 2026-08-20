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
import { heroGradient } from '@/theme/gradients';

const RootNavigatorSafe = withErrorBoundary(RootNavigator, 'Longlivy');

const NavigationRoot: React.FC = () => {
  const { theme } = useTheme();

  // React Navigation's own screen wrapper (`Background`, from
  // @react-navigation/elements) paints every screen — and the space around
  // any transparent-margin custom component like FloatingTabBar — with
  // `colors.background` from this theme as a base layer, at every navigator
  // level (root stack, tab navigator, each nested stack). Every screen in
  // the app is a hardcoded dark hero surface regardless of `theme.mode`
  // (light/dark here only ever changed a handful of legacy screens, not the
  // hero design), so following `theme.colors.background` left that base
  // layer white whenever the system appearance was light — invisible where
  // a screen's own opaque background fully covered it, but showing through
  // as a large light "card" behind the floating tab bar's intentionally
  // transparent margins. Pinned to the hero gradient's own base color
  // instead, so this layer matches what's actually always on screen.
  const navigationTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: heroGradient[0],
      card: heroGradient[0],
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
