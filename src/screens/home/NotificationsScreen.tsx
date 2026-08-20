import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotifications } from '@/features/notifications/selectors';
import { markAllNotificationsRead, markNotificationRead } from '@/features/notifications/notificationSlice';
import { AppNotification } from '@/features/notifications/models';

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  return (
    <TabHeroLayout title="Notifications" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: AppNotification }) => (
          <HeroCard onPress={() => dispatch(markNotificationRead(item.id))} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {item.title}
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.5)">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }}>
              {item.body}
            </AppText>
          </HeroCard>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <AppIcon name="notifications-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No notifications
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
