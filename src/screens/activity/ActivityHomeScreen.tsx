import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
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
    <TabHeroLayout title="Activity">
      {active ? (
        <HeroCard onPress={() => navigation.navigate('ActiveActivity')} style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="headingSmall" color="#FFFFFF">
            {ACTIVITY_TYPE_LABELS[active.type]} in progress
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
            Tap to resume tracking
          </AppText>
        </HeroCard>
      ) : (
        <AppGradientButton
          label="Start activity"
          onPress={() => navigation.navigate('SelectActivity')}
          colors={['#6AA3DE', '#1F4E7A']}
          style={{ marginBottom: theme.spacing.md }}
        />
      )}

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.xs }}>
        <StatTile label="Activities" value={`${stats.totalActivities}`} />
        <StatTile label="Distance" value={`${(stats.totalDistanceMeters / 1000).toFixed(1)} km`} />
        <StatTile label="Calories" value={`${stats.totalCalories}`} />
      </View>

      <HeroCard onPress={() => navigation.navigate('ManualActivity')} style={{ marginBottom: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Log manual activity
        </AppText>
      </HeroCard>

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
        Recent activities
      </AppText>
      {history.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            No activities yet
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            Start your first workout to see it here.
          </AppText>
        </View>
      ) : (
        history.slice(0, 5).map((a) => (
          <HeroCard key={a.id} onPress={() => navigation.navigate('ActivityDetails', { activityId: a.id })} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="headingSmall" color="#FFFFFF">
                  {ACTIVITY_TYPE_LABELS[a.type]}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {new Date(a.startTimestamp).toLocaleDateString()} · {Math.round(a.activeDuration / 60000)} min
                </AppText>
              </View>
              <AppText variant="bodyMedium" color="#FFFFFF">
                {a.calories ?? '—'} kcal
              </AppText>
            </View>
          </HeroCard>
        ))
      )}
      <HeroCard onPress={() => navigation.navigate('ActivityHistory')} style={{ paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="rgba(255,255,255,0.7)" align="center">
          View full history
        </AppText>
      </HeroCard>
    </TabHeroLayout>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => (
  <View style={{ flex: 1 }}>
    <HeroCard>
      <AppText variant="headingSmall" color="#FFFFFF">
        {value}
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
    </HeroCard>
  </View>
));
StatTile.displayName = 'StatTile';
