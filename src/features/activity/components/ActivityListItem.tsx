import React from 'react';
import { View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { ActivityFigure } from './ActivityFigure';
import { getActivityImage } from '../activityImages';
import { dashboardCardElevated } from '@/features/dashboard/dashboardTheme';

const CARD_HEIGHT = 128;

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (date.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

const MetaPill: React.FC<{ label: string }> = ({ label }) => (
  <View
    style={{
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginRight: 6,
      marginTop: 4,
    }}
  >
    <AppText variant="caption" color="#FFFFFF" weight="600">
      {label}
    </AppText>
  </View>
);

/**
 * A reusable row for any ActivityType — cinematic photo background (see
 * activityImages.ts), a left-to-right dark scrim so the icon/text stay
 * readable regardless of which image is behind them, ActivityFigure kept
 * as the foreground icon-well visual, and whichever of duration/distance/
 * calories are actually available for that entry as small glass pills.
 * New activity types automatically get a sensible figure/fallback from
 * ActivityFigure and image from getActivityImage without this component
 * needing to know about them.
 */
export const ActivityListItem: React.FC<{ activity: Activity; onPress: () => void }> = React.memo(({ activity, onPress }) => {
  const { theme } = useTheme();
  const durationMin = Math.round(activity.activeDuration / 60000);
  const distanceKm = activity.distanceMeters != null ? (activity.distanceMeters / 1000).toFixed(1) : null;

  return (
    <HeroCard
      onPress={onPress}
      scaleOnPress
      style={[dashboardCardElevated, { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.sm }]}
    >
      <View style={{ height: CARD_HEIGHT, width: '100%' }}>
        {/* A plain normal-flow Image establishes the card's real content — StyleSheet.absoluteFill inside this Animated.View chain does not resolve a size here, so every overlay layer below is explicitly positioned/sized instead. */}
        <Image source={getActivityImage(activity.type)} style={{ width: '100%', height: CARD_HEIGHT }} resizeMode="cover" />
        {/* Darker on the left where the text/icon sit, fading out toward the right so the photo's subject reads through — per the app's "content stays legible, image does the atmosphere" rule. */}
        <LinearGradient
          colors={['rgba(5,8,12,0.95)', 'rgba(5,8,12,0.65)', 'rgba(5,8,12,0.1)']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: CARD_HEIGHT }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: CARD_HEIGHT, flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: 'rgba(8,11,15,0.55)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <ActivityFigure type={activity.type} size={44} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="headingSmall" color="#FFFFFF" weight="700">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={{ marginTop: 1 }}>
              {formatWhen(activity.startTimestamp)}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <MetaPill label={`${durationMin} min`} />
              {distanceKm ? <MetaPill label={`${distanceKm} km`} /> : null}
              {activity.calories != null ? <MetaPill label={`${activity.calories} kcal`} /> : null}
            </View>
          </View>
        </View>
      </View>
    </HeroCard>
  );
});
ActivityListItem.displayName = 'ActivityListItem';
