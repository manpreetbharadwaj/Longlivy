import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { AppBadge } from '@/components/common/AppBadge';
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
import { ActivityHeroLayout } from './ActivityHeroLayout';

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
      <ActivityHeroLayout title="Active activity" onBack={() => navigation.goBack()} scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg }}>
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
            <AppIcon name="walk-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            No active activity
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            Start one from the Activity home screen.
          </AppText>
        </View>
      </ActivityHeroLayout>
    );
  }

  const isPaused = activity.status === 'paused';

  return (
    <ActivityHeroLayout title={ACTIVITY_TYPE_LABELS[activity.type]} onBack={() => navigation.goBack()} scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppBadge label={ACTIVITY_TYPE_LABELS[activity.type]} tone="info" />
        <AppText variant="metricLarge" color="#FFFFFF" style={{ marginVertical: theme.spacing.md }}>
          {formatDurationHMS(activeDurationMs)}
        </AppText>
        {isPaused ? (
          <AppBadge label="Paused" tone="warning" />
        ) : (
          <GpsStatusLine gpsAvailable={activity.gpsAvailable} status={gps.status} message={gps.message} />
        )}

        <View style={{ marginTop: theme.spacing.lg, width: '100%' }}>
          <HeroCard>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <MiniStat label="Distance" value={gps.distanceMeters != null ? `${(gps.distanceMeters / 1000).toFixed(2)} km` : '—'} />
              <MiniStat label="Pace" value={pace ? `${pace.toFixed(1)} /km` : '—'} />
            </View>
          </HeroCard>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        {isPaused ? (
          <View style={{ flex: 1 }}>
            <AppGradientButton label="Resume" onPress={() => dispatch(resumeActivityThunk(activity.id))} colors={['#5B9BD5', '#2C5C87']} />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <OutlineButton label="Pause" onPress={() => dispatch(pauseActivityThunk(activity.id))} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <AppGradientButton label="End" onPress={handleEnd} colors={['#DD7A68', '#C4463A']} />
        </View>
      </View>
    </ActivityHeroLayout>
  );
};

const GpsStatusLine: React.FC<{ gpsAvailable: boolean; status: ReturnType<typeof useGpsTracking>['status']; message: string | null }> = ({
  gpsAvailable,
  status,
  message,
}) => {
  if (!gpsAvailable) {
    return (
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
        GPS unavailable for this activity — duration still recorded
      </AppText>
    );
  }
  if (status === 'denied' || status === 'unavailable') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 280 }}>
        <AppIcon name="warning-outline" size={16} color="#DFA860" />
        <AppText variant="bodySmall" color="#DFA860" style={{ marginLeft: 6, flexShrink: 1 }}>
          {message ?? 'GPS unavailable — duration still recorded'}
        </AppText>
      </View>
    );
  }
  if (status === 'tracking') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="navigate" size={16} color="#3FCE87" />
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }}>
          GPS tracking active
        </AppText>
      </View>
    );
  }
  return (
    <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
      Acquiring GPS signal…
    </AppText>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ alignItems: 'center' }}>
    <AppText variant="headingMedium" color="#FFFFFF">
      {value}
    </AppText>
    <AppText variant="caption" color="rgba(255,255,255,0.6)">
      {label}
    </AppText>
  </View>
);

/** Secondary action on the activity hero screens — translucent border, no fill, dims on press. Matches ActiveFastScreen's OutlineButton. */
const OutlineButton: React.FC<{ label: string; onPress: () => void }> = React.memo(({ label, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: theme.componentSizes.buttonHeight,
        borderRadius: theme.radius.md,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppText variant="headingSmall" color="#FFFFFF">
        {label}
      </AppText>
    </Pressable>
  );
});
OutlineButton.displayName = 'OutlineButton';
