import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';

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
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
          {greeting()}
        </AppText>
        <AppText variant="headingLarge" color="#FFFFFF">
          {profile.firstName}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.navigate('Notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={{ marginRight: theme.spacing.sm }}
        >
          <View>
            <AppIcon name="notifications-outline" size={22} color="#FFFFFF" />
            {unread > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  backgroundColor: '#E06A5D',
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <AppText variant="caption" color="#FFFFFF">
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
              backgroundColor: 'rgba(95,191,174,0.25)',
              borderWidth: 1.5,
              borderColor: 'rgba(95,191,174,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="headingSmall" color="#5FBFAE">
              {profile.firstName.charAt(0)}
            </AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
