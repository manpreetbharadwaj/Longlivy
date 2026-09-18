import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveActivity } from '@/features/activity/selectors';
import { pauseActivityThunk, resumeActivityThunk, endActivityThunk, startActivityThunk } from '@/features/activity/activitySlice';
import { useActivityTimer } from '@/features/activity/hooks/useActivityTimer';
import { useGpsTracking } from '@/features/activity/hooks/useGpsTracking';
import { useActivityCountdown } from '@/features/activity/hooks/useActivityCountdown';
import { useVoiceCoach } from '@/features/activity/hooks/useVoiceCoach';
import { formatDurationHMS } from '@/features/fasting/services/FastingCalculator';
import { ActivityType, ACTIVITY_TYPE_LABELS, GPS_BASED_TYPES } from '@/features/activity/models';
import { calculatePace, calculateSpeed } from '@/features/activity/services/ActivityCalculator';
import { ActivityFigure } from '@/features/activity/components/ActivityFigure';
import { getActivityImage } from '@/features/activity/activityImages';
import { ActivityHeroLayout } from './ActivityHeroLayout';

const ACTIVITY_ACCENT = '#FF7A63';

export const ActiveActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const route = useRoute<RouteProp<ActivityStackParamList, 'ActiveActivity'>>();
  const dispatch = useAppDispatch();
  const activity = useAppSelector(selectActiveActivity);

  // Set only when arriving straight from SelectActivityScreen with a type
  // still to be confirmed by the countdown — never persisted, never touches
  // Redux/the repository. Once `activity` exists (post-"Go"), the render
  // below falls straight through to the normal active-session UI; there's
  // nothing to reset it back to null for (a fresh countdown always arrives
  // via a fresh `navigation.replace`, which remounts this screen).
  const [pendingType] = useState<ActivityType | null>(route.params?.pendingType ?? null);

  const handleGo = useCallback(() => {
    if (!pendingType) return;
    // Only now does a real Activity record exist: real startTimestamp, and
    // only from here on do duration/distance/calories/GPS route actually
    // accumulate — nothing during the countdown above touched the store.
    dispatch(startActivityThunk({ type: pendingType, gpsAvailable: GPS_BASED_TYPES.includes(pendingType) }));
  }, [dispatch, pendingType]);

  const countdown = useActivityCountdown(activity ? null : pendingType, handleGo);

  const { activeDurationMs } = useActivityTimer(activity);
  const gps = useGpsTracking(activity?.gpsAvailable ?? false, activity?.status === 'active');
  useVoiceCoach(activity, activeDurationMs);

  const pace = gps.distanceMeters ? calculatePace(gps.distanceMeters, activeDurationMs) : null;
  const speed = gps.distanceMeters ? calculateSpeed(gps.distanceMeters, activeDurationMs) : null;

  const cancelCountdown = useCallback(() => {
    countdown.cancel();
    navigation.goBack();
  }, [countdown, navigation]);

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

  // Countdown owns the screen until the real Activity exists — no timer,
  // distance, calories or GPS collection have started yet (see the guards
  // above: useActivityTimer/useGpsTracking/useVoiceCoach all key off
  // `activity`, which is still null here), and cancelling never creates a
  // history entry because startActivityThunk was never dispatched.
  if (pendingType && !activity) {
    return <CountdownView type={pendingType} secondsRemaining={countdown.secondsRemaining} onCancel={cancelCountdown} />;
  }

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
    <ActivityHeroLayout
      onBack={() => navigation.goBack()}
      scroll={false}
      backgroundImageSource={getActivityImage(activity.type)}
      // Kept low so the activity-type photo genuinely reads as the scene
      // this session is happening in, not a decorative sliver behind a flat
      // panel — the gradient still carries enough contrast for white text.
      backgroundImageGradientOpacity={0.62}
    >
      {/* "Entering Activity Mode", not "a stopwatch screen": the activity
          itself — its animated figure, its own large title — is the visual
          hero. The timer still exists (it's the thing people glance at most
          mid-session) but sits a size below the title instead of being the
          first and biggest thing on screen. Entrance is staggered
          background -> visual -> title -> timer -> metrics, matching the
          cascade used for the onboarding pillar showcase. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {isPaused ? (
          <FadeSlideIn style={{ position: 'absolute', top: 0 }}>
            <AppBadge label="Paused" tone="warning" />
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn fromScale={0.85} style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 168,
              height: 168,
              borderRadius: 84,
              backgroundColor: `${ACTIVITY_ACCENT}22`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityFigure type={activity.type} size={108} color="#FFFFFF" />
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={motion.staggerStepMs * 2} style={{ marginTop: theme.spacing.md, alignItems: 'center' }}>
          <AppText variant="displayLarge" weight="800" color="#FFFFFF" style={{ letterSpacing: 1 }}>
            {ACTIVITY_TYPE_LABELS[activity.type].toUpperCase()}
          </AppText>
          {!isPaused ? <GpsStatusLine gpsAvailable={activity.gpsAvailable} status={gps.status} message={gps.message} /> : null}
        </FadeSlideIn>

        <FadeSlideIn delay={motion.staggerStepMs * 3} style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
          <AppText variant="label" color="rgba(255,255,255,0.55)" style={{ letterSpacing: 2 }}>
            ELAPSED
          </AppText>
          <AppText variant="metricLarge" color="#FFFFFF" style={{ marginTop: 2 }}>
            {formatDurationHMS(activeDurationMs)}
          </AppText>
        </FadeSlideIn>

        {/* Distance/pace/speed metrics only appear once there's something real
            to show — GPS-less activities (or a fix not acquired yet) simply
            skip this row rather than showing a row of dashes. */}
        {activity.gpsAvailable && gps.distanceMeters != null ? (
          <FadeSlideIn delay={motion.staggerStepMs * 5} style={{ marginTop: theme.spacing.xl, width: '100%', flexDirection: 'row', justifyContent: 'space-around' }}>
            <MiniStat label="Distance" value={`${(gps.distanceMeters / 1000).toFixed(2)} km`} />
            <MiniStat label="Pace" value={pace ? `${pace.toFixed(1)} /km` : '—'} />
            <MiniStat label="Speed" value={speed ? `${speed.toFixed(1)} km/h` : '—'} />
          </FadeSlideIn>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        {isPaused ? (
          <View style={{ flex: 1 }}>
            <AppGradientButton label="Resume" onPress={() => dispatch(resumeActivityThunk(activity.id))} colors={['#FF7A63', '#0E9BB5']} />
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
      <AppText variant="bodySmall" color="rgba(255,255,255,0.55)" style={{ marginTop: 4 }}>
        GPS unavailable for this activity — duration still recorded
      </AppText>
    );
  }
  if (status === 'denied' || status === 'unavailable') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 280, marginTop: 4 }}>
        <AppIcon name="warning-outline" size={14} color="#DFA860" />
        <AppText variant="caption" color="#DFA860" style={{ marginLeft: 6, flexShrink: 1 }}>
          {message ?? 'GPS unavailable — duration still recorded'}
        </AppText>
      </View>
    );
  }
  if (status === 'tracking') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <AppIcon name="navigate" size={14} color="#34D399" />
        <AppText variant="caption" color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }}>
          GPS tracking active
        </AppText>
      </View>
    );
  }
  return (
    <AppText variant="caption" color="rgba(255,255,255,0.6)" style={{ marginTop: 4 }}>
      Acquiring GPS signal…
    </AppText>
  );
};

/**
 * Pre-start countdown — a distinct phase of this same screen (not a
 * separate route) so "entering Activity Mode" reads as one continuous
 * moment. Shows "GO!" once the visible countdown reaches zero, which also
 * covers the brief gap between the "Go" announcement firing and the real
 * Activity actually landing in the store, so that window never reads as
 * frozen/stuck.
 */
const CountdownView: React.FC<{ type: ActivityType; secondsRemaining: number | null; onCancel: () => void }> = ({
  type,
  secondsRemaining,
  onCancel,
}) => {
  const { theme } = useTheme();
  const showGo = secondsRemaining == null || secondsRemaining <= 0;
  return (
    <ActivityHeroLayout onBack={onCancel} scroll={false} backgroundImageSource={getActivityImage(type)} backgroundImageGradientOpacity={0.7}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FadeSlideIn>
          <AppText variant="label" color="rgba(255,255,255,0.6)" style={{ letterSpacing: 2 }} align="center">
            GET READY
          </AppText>
        </FadeSlideIn>
        <FadeSlideIn delay={motion.staggerStepMs}>
          <AppText variant="displayLarge" weight="800" color="#FFFFFF" style={{ letterSpacing: 1, marginTop: theme.spacing.xxs }} align="center">
            {ACTIVITY_TYPE_LABELS[type].toUpperCase()}
          </AppText>
        </FadeSlideIn>
        <AppText variant="metricLarge" color="#FFFFFF" style={{ marginTop: theme.spacing.xl }}>
          {showGo ? 'GO!' : secondsRemaining}
        </AppText>
      </View>
      <View style={{ marginTop: theme.spacing.lg }}>
        <OutlineButton label="Cancel" onPress={onCancel} />
      </View>
    </ActivityHeroLayout>
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
