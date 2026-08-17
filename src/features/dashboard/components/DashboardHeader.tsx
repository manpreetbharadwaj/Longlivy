import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { Pressable } from 'react-native';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardHeader: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const profile = useAppSelector(selectUserProfile);
  const unread = useAppSelector(selectUnreadNotificationCount);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <View>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
          {greeting()}
        </AppText>
        <AppText variant="headingLarge">{profile.firstName}</AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={{ marginRight: theme.spacing.sm }}
        >
          <View>
            <AppIcon name="notifications-outline" size={22} color={theme.colors.textPrimary} />
            {unread > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  backgroundColor: theme.colors.danger,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <AppText variant="caption" color={theme.colors.textInverse}>
                  {unread}
                </AppText>
              </View>
            ) : null}
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Profile">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="headingSmall" color={theme.colors.primary}>
              {profile.firstName.charAt(0)}
            </AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
