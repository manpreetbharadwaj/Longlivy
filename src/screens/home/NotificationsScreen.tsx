import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotifications } from '@/features/notifications/selectors';
import { markAllNotificationsRead, markNotificationRead } from '@/features/notifications/notificationSlice';
import { AppNotification } from '@/features/notifications/models';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Notifications" onBack={() => navigation.goBack()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        renderItem={({ item }: { item: AppNotification }) => (
          <AppCard onPress={() => dispatch(markNotificationRead(item.id))} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="headingSmall">{item.title}</AppText>
              <AppText variant="caption" color={theme.colors.textTertiary}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: 2 }}>
              {item.body}
            </AppText>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState icon="notifications-outline" title="No notifications" />}
      />
    </SafeAreaView>
  );
};
