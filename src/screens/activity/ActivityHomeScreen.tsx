import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadActivityData } from '@/features/activity/activitySlice';
import { selectActiveActivity, selectActivityHistory, selectActivityStats } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';

export const ActivityHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const dispatch = useAppDispatch();
  const active = useAppSelector(selectActiveActivity);
  const history = useAppSelector(selectActivityHistory);
  const stats = useAppSelector(selectActivityStats);

  useEffect(() => {
    dispatch(loadActivityData());
  }, [dispatch]);

  return (
    <AppScreen>
      <AppText variant="displayMedium" style={{ marginBottom: theme.spacing.md }}>
        Activity
      </AppText>

      {active ? (
        <AppCard onPress={() => navigation.navigate('ActiveActivity')} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="headingSmall">{ACTIVITY_TYPE_LABELS[active.type]} in progress</AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
            Tap to resume tracking
          </AppText>
        </AppCard>
      ) : (
        <AppButton label="Start activity" onPress={() => navigation.navigate('SelectActivity')} style={{ marginBottom: theme.spacing.md }} />
      )}

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <StatTile label="Activities" value={`${stats.totalActivities}`} />
        <StatTile label="Distance" value={`${(stats.totalDistanceMeters / 1000).toFixed(1)} km`} />
        <StatTile label="Calories" value={`${stats.totalCalories}`} />
      </View>

      <AppButton label="Log manual activity" onPress={() => navigation.navigate('ManualActivity')} variant="outline" style={{ marginBottom: theme.spacing.md }} />

      <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.sm }}>
        Recent activities
      </AppText>
      {history.length === 0 ? (
        <AppEmptyState title="No activities yet" message="Start your first workout to see it here." />
      ) : (
        history.slice(0, 5).map((a) => (
          <AppCard key={a.id} onPress={() => navigation.navigate('ActivityDetails', { activityId: a.id })} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="headingSmall">{ACTIVITY_TYPE_LABELS[a.type]}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {new Date(a.startTimestamp).toLocaleDateString()} · {Math.round(a.activeDuration / 60000)} min
                </AppText>
              </View>
              <AppText variant="bodyMedium">{a.calories ?? '—'} kcal</AppText>
            </View>
          </AppCard>
        ))
      )}
      <AppButton label="View full history" onPress={() => navigation.navigate('ActivityHistory')} variant="ghost" />
    </AppScreen>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
      <AppCard>
        <AppText variant="headingSmall">{value}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {label}
        </AppText>
      </AppCard>
    </View>
  );
});
StatTile.displayName = 'StatTile';
