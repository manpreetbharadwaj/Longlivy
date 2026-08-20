import React, { useCallback } from 'react';
import { View, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
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
    <TabHeroLayout title="Profile" onBack={() => navigation.goBack()}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(95,191,174,0.25)',
            borderWidth: 1.5,
            borderColor: 'rgba(95,191,174,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppText variant="displayMedium" color="#5FBFAE">
            {profile.firstName.charAt(0)}
          </AppText>
        </View>
        <AppText variant="headingLarge" color="#FFFFFF">
          {profile.firstName} {profile.lastName}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
          {profile.email}
        </AppText>
      </View>

      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <Row label="Height" value={`${profile.heightCm} cm`} />
        <Row label="Weight" value={`${profile.weightKg} kg`} />
        <Row label="Activity level" value={profile.activityLevel.replace('_', ' ')} />
        <Row label="Goal" value={profile.goal.replace('_', ' ')} last />
      </HeroCard>

      <OutlineLink label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
      <OutlineLink label="Settings" onPress={() => navigation.navigate('Settings')} />
      <OutlineLink label="Health integrations" onPress={() => navigation.navigate('HealthIntegrations')} />
      <OutlineLink label="Privacy" onPress={() => navigation.navigate('Privacy')} style={{ marginBottom: theme.spacing.md }} />
      <AppGradientButton label="Log out" onPress={handleLogout} colors={['#E7896A', '#C4463A']} />
    </TabHeroLayout>
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
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
      <AppText variant="bodyMedium" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};

/** Secondary nav link on hero screens — translucent bordered row, matches the OutlineButton pattern used on ActiveFastScreen. */
const OutlineLink: React.FC<{ label: string; onPress: () => void; style?: ViewStyle }> = ({ label, onPress, style }) => {
  const { theme } = useTheme();
  return (
    <HeroCard onPress={onPress} style={[{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }, style]}>
      <AppText variant="headingSmall" color="#FFFFFF" align="center">
        {label}
      </AppText>
    </HeroCard>
  );
};
