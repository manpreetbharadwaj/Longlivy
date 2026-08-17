import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { activityRepository } from '@/features/activity/repository/MockActivityRepository';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';

export const ActivitySummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const route = useRoute<RouteProp<ActivityStackParamList, 'ActivitySummary'>>();
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    activityRepository.getHistory('user_demo_1').then((list) => {
      setActivity(list.find((a) => a.id === route.params.activityId) ?? null);
    });
  }, [route.params.activityId]);

  if (!activity) return <AppLoader fullscreen />;

  return (
    <AppScreen>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
        <AppIconTile name="checkmark-circle" shape="circle" color={theme.colors.success} size={72} iconSize={36} style={{ marginBottom: theme.spacing.sm }} />
        <AppText variant="displayMedium" align="center">
          {ACTIVITY_TYPE_LABELS[activity.type]} complete
        </AppText>
      </View>
      <AppCard>
        <Row label="Duration" value={`${Math.round(activity.activeDuration / 60000)} min`} />
        <Row label="Distance" value={activity.distanceMeters != null ? `${(activity.distanceMeters / 1000).toFixed(2)} km` : 'Unavailable (no GPS)'} />
        {activity.pace ? <Row label="Pace" value={`${activity.pace.toFixed(1)} min/km`} /> : null}
        {activity.elevationGainMeters ? <Row label="Elevation gain" value={`${activity.elevationGainMeters} m`} /> : null}
        <Row label="Calories" value={`${activity.calories ?? '—'} kcal (${activity.calorieSource ?? 'unknown'})`} />
        <Row label="Source" value={activity.source} last />
      </AppCard>
      {activity.gpsUnavailableReason ? (
        <AppText variant="caption" color={theme.colors.textTertiary} align="center" style={{ marginTop: theme.spacing.sm }}>
          {activity.gpsUnavailableReason}
        </AppText>
      ) : null}
      <AppButton label="Done" onPress={() => navigation.popToTop()} style={{ marginTop: theme.spacing.lg }} />
    </AppScreen>
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
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};
