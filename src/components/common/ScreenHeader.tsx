import React from 'react';
import { Pressable, View } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '@/navigation/types';
import { useAppSelector } from '@/store/hooks';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { selectUserProfile } from '@/features/profile/selectors';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/useTheme';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
}

/**
 * Shared header for titled top-level screens. SectionHeroLayout already owns
 * the SafeAreaView, so this component only lays out its content within the
 * safe area supplied by the screen shell.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = React.memo(({ title }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const profile = useAppSelector(selectUserProfile);
  const unread = useAppSelector(selectUnreadNotificationCount);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
        {title}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
          accessibilityRole="button"
          accessibilityLabel={t('notifications.title')}
          hitSlop={8}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.xs }}
        >
          <View>
            <AppIcon name="notifications-outline" size={22} color={dashboardColors.textPrimary} />
            {unread > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  backgroundColor: dashboardColors.accent,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <AppText variant="caption" color={dashboardColors.background} weight="700">
                  {unread}
                </AppText>
              </View>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}
          accessibilityRole="button"
          accessibilityLabel={t('profile.title')}
          hitSlop={8}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <UserAvatar size={40} avatarId={profile.avatarId} name={profile.firstName} />
        </Pressable>
      </View>
    </View>
  );
});

ScreenHeader.displayName = 'ScreenHeader';
