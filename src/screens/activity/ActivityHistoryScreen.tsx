import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActivityHistory } from '@/features/activity/selectors';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ActivityHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const history = useAppSelector(selectActivityHistory);

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <AppCard onPress={() => navigation.navigate('ActivityDetails', { activityId: item.id })} style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="headingSmall">{ACTIVITY_TYPE_LABELS[item.type]}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {new Date(item.startTimestamp).toLocaleDateString()} · {Math.round(item.activeDuration / 60000)} min
            </AppText>
          </View>
          <AppText variant="bodyMedium">{item.calories ?? '—'} kcal</AppText>
        </View>
      </AppCard>
    ),
    [navigation, theme]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Activity history" onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        ListEmptyComponent={<AppEmptyState title="No activities yet" />}
      />
    </SafeAreaView>
  );
};
