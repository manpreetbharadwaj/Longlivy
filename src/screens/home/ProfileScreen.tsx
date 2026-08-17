import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { logoutThunk } from '@/features/auth/authSlice';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);

  const handleLogout = useCallback(() => dispatch(logoutThunk()), [dispatch]);

  return (
    <>
      <AppHeader title="Profile" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.sm,
            }}
          >
            <AppText variant="displayMedium" color={theme.colors.primary}>
              {profile.firstName.charAt(0)}
            </AppText>
          </View>
          <AppText variant="headingLarge">
            {profile.firstName} {profile.lastName}
          </AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
            {profile.email}
          </AppText>
        </View>

        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <Row label="Height" value={`${profile.heightCm} cm`} />
          <Row label="Weight" value={`${profile.weightKg} kg`} />
          <Row label="Activity level" value={profile.activityLevel.replace('_', ' ')} />
          <Row label="Goal" value={profile.goal.replace('_', ' ')} last />
        </AppCard>

        <AppButton label="Edit profile" onPress={() => navigation.navigate('EditProfile')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Settings" onPress={() => navigation.navigate('Settings')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Health integrations" onPress={() => navigation.navigate('HealthIntegrations')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Privacy" onPress={() => navigation.navigate('Privacy')} variant="outline" style={{ marginBottom: theme.spacing.md }} />
        <AppButton label="Log out" onPress={handleLogout} variant="danger" />
      </AppScreen>
    </>
  );
};

const Row: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};
