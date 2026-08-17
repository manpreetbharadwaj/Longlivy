import React from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ActivityStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
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
    <>
      <AppHeader title="Activity details" onBack={() => navigation.goBack()} />
      <AppScreen>
        {!activity ? (
          <AppEmptyState title="Activity not found" />
        ) : (
          <AppCard>
            <AppText variant="headingLarge" style={{ marginBottom: theme.spacing.sm }}>
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
          </AppCard>
        )}
        {activity?.gpsUnavailableReason ? (
          <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.sm }}>
            {activity.gpsUnavailableReason}
          </AppText>
        ) : null}
      </AppScreen>
    </>
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
