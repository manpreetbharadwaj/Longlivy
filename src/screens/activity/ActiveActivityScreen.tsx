import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppBadge } from '@/components/common/AppBadge';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveActivity } from '@/features/activity/selectors';
import { pauseActivityThunk, resumeActivityThunk, endActivityThunk } from '@/features/activity/activitySlice';
import { useActivityTimer } from '@/features/activity/hooks/useActivityTimer';
import { useGpsTracking } from '@/features/activity/hooks/useGpsTracking';
import { formatDurationHMS } from '@/features/fasting/services/FastingCalculator';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { calculatePace, calculateSpeed } from '@/features/activity/services/ActivityCalculator';

export const ActiveActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const dispatch = useAppDispatch();
  const activity = useAppSelector(selectActiveActivity);
  const { activeDurationMs } = useActivityTimer(activity);
  const gps = useGpsTracking(activity?.gpsAvailable ?? false, activity?.status === 'active');

  const pace = gps.distanceMeters ? calculatePace(gps.distanceMeters, activeDurationMs) : null;

  const handleEnd = useCallback(async () => {
    if (!activity) return;
    const result = await dispatch(
      endActivityThunk({
        id: activity.id,
        gps: activity.gpsAvailable
          ? {
              distanceMeters: gps.distanceMeters,
              elevationGainMeters: gps.elevationGainMeters,
              route: gps.route.length > 0 ? gps.route : null,
              gpsUnavailableReason: gps.status === 'denied' || gps.status === 'unavailable' ? gps.message : null,
            }
          : undefined,
      })
    );
    if (endActivityThunk.fulfilled.match(result)) {
      navigation.replace('ActivitySummary', { activityId: result.payload.id });
    }
  }, [activity, dispatch, navigation, gps]);

  if (!activity) {
    return (
      <AppScreen>
        <AppEmptyState title="No active activity" message="Start one from the Activity home screen." />
      </AppScreen>
    );
  }

  const isPaused = activity.status === 'paused';

  return (
    <AppScreen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppBadge label={ACTIVITY_TYPE_LABELS[activity.type]} tone="info" />
        <AppText variant="metricLarge" style={{ marginVertical: theme.spacing.md }}>
          {formatDurationHMS(activeDurationMs)}
        </AppText>
        {isPaused ? (
          <AppBadge label="Paused" tone="warning" />
        ) : (
          <GpsStatusLine gpsAvailable={activity.gpsAvailable} status={gps.status} message={gps.message} />
        )}

        <AppCard style={{ marginTop: theme.spacing.lg, width: '100%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <MiniStat label="Distance" value={gps.distanceMeters != null ? `${(gps.distanceMeters / 1000).toFixed(2)} km` : '—'} />
            <MiniStat label="Pace" value={pace ? `${pace.toFixed(1)} /km` : '—'} />
          </View>
        </AppCard>
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg }}>
        {isPaused ? (
          <AppButton label="Resume" onPress={() => dispatch(resumeActivityThunk(activity.id))} style={{ flex: 1, marginRight: theme.spacing.xs }} />
        ) : (
          <AppButton label="Pause" onPress={() => dispatch(pauseActivityThunk(activity.id))} variant="outline" style={{ flex: 1, marginRight: theme.spacing.xs }} />
        )}
        <AppButton label="End" onPress={handleEnd} variant="danger" style={{ flex: 1 }} />
      </View>
    </AppScreen>
  );
};

const GpsStatusLine: React.FC<{ gpsAvailable: boolean; status: ReturnType<typeof useGpsTracking>['status']; message: string | null }> = ({
  gpsAvailable,
  status,
  message,
}) => {
  const { theme } = useTheme();
  if (!gpsAvailable) {
    return (
      <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
        GPS unavailable for this activity — duration still recorded
      </AppText>
    );
  }
  if (status === 'denied' || status === 'unavailable') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 280 }}>
        <AppIcon name="warning-outline" size={16} color={theme.colors.warning} />
        <AppText variant="bodySmall" color={theme.colors.warning} style={{ marginLeft: 6, flexShrink: 1 }}>
          {message ?? 'GPS unavailable — duration still recorded'}
        </AppText>
      </View>
    );
  }
  if (status === 'tracking') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="navigate" size={16} color={theme.colors.success} />
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginLeft: 6 }}>
          GPS tracking active
        </AppText>
      </View>
    );
  }
  return (
    <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
      Acquiring GPS signal…
    </AppText>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <AppText variant="headingMedium">{value}</AppText>
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
};
