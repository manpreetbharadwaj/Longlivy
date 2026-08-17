import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/common/AppText';

/**
 * Fully static — no network/API dependency. Fades in the wordmark then
 * hands off to whichever route RootNavigator decides on (onboarding, auth,
 * or main app) once auth/session bootstrap resolves.
 */
export const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            backgroundColor: theme.colors.onPrimary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
          }}
        >
          <AppText variant="displayMedium" color={theme.colors.primary}>
            L
          </AppText>
        </View>
        <AppText variant="displayMedium" color={theme.colors.onPrimary}>
          Longlivy
        </AppText>
        <AppText variant="bodyMedium" color={theme.colors.onPrimary} style={{ opacity: 0.85, marginTop: 4 }}>
          Fasting · Nutrition · Activity · Meditation
        </AppText>
      </Animated.View>
    </View>
  );
};
