import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  return (
    <AppScreen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <AppText variant="displayMedium" color={theme.colors.onPrimary}>
            L
          </AppText>
        </View>
        <AppText variant="displayMedium" align="center">
          Welcome to Longlivy
        </AppText>
        <AppText
          variant="bodyLarge"
          color={theme.colors.textSecondary}
          align="center"
          style={{ marginTop: theme.spacing.sm, maxWidth: 320 }}
        >
          One place to understand your fasting, nutrition, activity and mind — connected, not scattered.
        </AppText>
      </View>
      <AppButton label="Get started" onPress={() => navigation.navigate('WhatIsLonglivy')} />
    </AppScreen>
  );
};
