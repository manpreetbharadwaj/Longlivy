import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import * as Notifications from 'expo-notifications';

import { store } from '@/store/store';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppPreferencesProvider } from '@/contexts/AppPreferencesContext';
import { I18nProvider } from '@/localization';
import { OnboardingProvider } from '@/features/onboarding/OnboardingContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { navigationRef, navigateToMeditationHome } from '@/navigation/navigationRef';
import { withErrorBoundary } from '@/components/hoc/withErrorBoundary';
import { useAppFonts } from '@/hooks/useAppFonts';
import { darkColors } from '@/theme/colors';

/**
 * Minimum useful behavior for a tapped Meditation reminder (Phase 6 Section
 * 19): open Meditation Home. Covers both a warm tap (app already running)
 * and a cold start from the notification (the initial response is checked
 * once on mount) — not a deep link into a specific session, which the
 * current navigation architecture doesn't support without meaningfully more
 * work; documented as a limitation rather than built here.
 */
function useMeditationReminderNotificationTap(): void {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) navigateToMeditationHome();
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      navigateToMeditationHome();
    });
    return () => subscription.remove();
  }, []);
}

const RootNavigatorSafe = withErrorBoundary(RootNavigator, 'Longlivy');

const NavigationRoot: React.FC = () => {
  const { theme } = useTheme();
  useMeditationReminderNotificationTap();

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
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigatorSafe />
    </NavigationContainer>
  );
};

export default function App() {
  const fontsLoaded = useAppFonts();

  // Nothing below this renders any text (AppText's typography variants all
  // name a custom fontFamily) until the font files are ready — otherwise
  // the very first frame would flash system-font text before the real
  // typeface pops in. Matches the dark hero atmosphere's base color so this
  // gap (typically a couple hundred ms) doesn't itself flash a mismatched
  // background against the native splash image before it.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: darkColors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <ThemeProvider>
            <AppPreferencesProvider>
              <I18nProvider>
                <OnboardingProvider>
                  <NavigationRoot />
                </OnboardingProvider>
              </I18nProvider>
            </AppPreferencesProvider>
          </ThemeProvider>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
