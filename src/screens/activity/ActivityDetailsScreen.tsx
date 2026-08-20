import React from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActivityHistory } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';

export const ActivityDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ActivityStackParamList, 'ActivityDetails'>>();
  const history = useAppSelector(selectActivityHistory);
  const activity = history.find((a) => a.id === route.params.activityId);

  return (
    <TabHeroLayout title="Activity details" onBack={() => navigation.goBack()}>
      {!activity ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
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
            <AppIcon name="alert-circle-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Activity not found
          </AppText>
        </View>
      ) : (
        <HeroCard>
          <AppText variant="headingLarge" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </AppText>
          <Row label="Date" value={new Date(activity.startTimestamp).toLocaleString()} />
          <Row label="Duration" value={`${Math.round(activity.activeDuration / 60000)} min`} />
          <Row label="Break time" value={`${Math.round(activity.pauseDuration / 60000)} min`} />
          <Row label="Distance" value={activity.distanceMeters != null ? `${(activity.distanceMeters / 1000).toFixed(2)} km` : 'Unavailable (no GPS)'} />
          <Row label="Pace" value={activity.pace ? `${activity.pace.toFixed(1)} min/km` : '—'} />
          <Row label="Elevation gain" value={activity.elevationGainMeters != null ? `${activity.elevationGainMeters} m` : '—'} />
          <Row label="Route points" value={activity.route ? `${activity.route.length}` : '—'} />
          <Row label="Calories" value={`${activity.calories ?? '—'} kcal`} />
          <Row label="Source" value={activity.calorieSource ?? activity.source} last />
        </HeroCard>
      )}
      {activity?.gpsUnavailableReason ? (
        <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.sm }}>
          {activity.gpsUnavailableReason}
        </AppText>
      ) : null}
    </TabHeroLayout>
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
        borderBottomColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
      <AppText variant="bodyMedium" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};
