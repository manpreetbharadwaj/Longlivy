import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { ActivityFigure } from './ActivityFigure';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

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
      backgroundColor: dashboardColors.surfaceSecondary,
      borderWidth: 1,
      borderColor: dashboardColors.border,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      marginRight: 6,
      marginTop: 4,
    }}
  >
    <AppText variant="caption" color={dashboardColors.textSecondary}>
      {label}
    </AppText>
  </View>
);

/**
 * A reusable row for any ActivityType — icon slot, name, relative
 * date/time, and whichever of duration/distance/calories are actually
 * available for that entry, as small pills rather than a single crammed
 * line. New activity types automatically get a sensible figure/fallback
 * from ActivityFigure without this component needing to know about them.
 */
export const ActivityListItem: React.FC<{ activity: Activity; onPress: () => void }> = React.memo(({ activity, onPress }) => {
  const { theme } = useTheme();
  const durationMin = Math.round(activity.activeDuration / 60000);
  const distanceKm = activity.distanceMeters != null ? (activity.distanceMeters / 1000).toFixed(1) : null;

  return (
    <HeroCard onPress={onPress} style={[dashboardCardStyle, { marginBottom: theme.spacing.sm }]} scaleOnPress>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: dashboardColors.surfaceSecondary,
            borderWidth: 1,
            borderColor: dashboardColors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.sm,
          }}
        >
          <ActivityFigure type={activity.type} size={44} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </AppText>
          <AppText variant="bodySmall" color={dashboardColors.textMuted} style={{ marginTop: 1 }}>
            {formatWhen(activity.startTimestamp)}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <MetaPill label={`${durationMin} min`} />
            {distanceKm ? <MetaPill label={`${distanceKm} km`} /> : null}
            {activity.calories != null ? <MetaPill label={`${activity.calories} kcal`} /> : null}
          </View>
        </View>
      </View>
    </HeroCard>
  );
});
ActivityListItem.displayName = 'ActivityListItem';
