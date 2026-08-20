import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActivityHistory } from '@/features/activity/selectors';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';

export const ActivityHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const history = useAppSelector(selectActivityHistory);

  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <HeroCard onPress={() => navigation.navigate('ActivityDetails', { activityId: item.id })} style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <AppText variant="headingSmall" color="#FFFFFF">
              {ACTIVITY_TYPE_LABELS[item.type]}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {new Date(item.startTimestamp).toLocaleDateString()} · {Math.round(item.activeDuration / 60000)} min
            </AppText>
          </View>
          <AppText variant="bodyMedium" color="#FFFFFF">
            {item.calories ?? '—'} kcal
          </AppText>
        </View>
      </HeroCard>
    ),
    [navigation, theme]
  );

  return (
    <TabHeroLayout title="Activity history" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
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
              <AppIcon name="file-tray-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No activities yet
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
