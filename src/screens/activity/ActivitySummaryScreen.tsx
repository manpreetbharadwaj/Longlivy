import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { activityRepository } from '@/features/activity/repository/MockActivityRepository';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { ActivityHeroLayout } from './ActivityHeroLayout';

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

  if (!activity) {
    return (
      <ActivityHeroLayout scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </ActivityHeroLayout>
    );
  }

  return (
    <ActivityHeroLayout>
      <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(79,183,126,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppIcon name="checkmark-circle" size={36} color="#3FCE87" />
        </View>
        <AppText variant="displayMedium" color="#FFFFFF" align="center">
          {ACTIVITY_TYPE_LABELS[activity.type]} complete
        </AppText>
      </View>
      <HeroCard>
        <Row label="Duration" value={`${Math.round(activity.activeDuration / 60000)} min`} />
        <Row label="Distance" value={activity.distanceMeters != null ? `${(activity.distanceMeters / 1000).toFixed(2)} km` : 'Unavailable (no GPS)'} />
        {activity.pace ? <Row label="Pace" value={`${activity.pace.toFixed(1)} min/km`} /> : null}
        {activity.elevationGainMeters ? <Row label="Elevation gain" value={`${activity.elevationGainMeters} m`} /> : null}
        <Row label="Calories" value={`${activity.calories ?? '—'} kcal (${activity.calorieSource ?? 'unknown'})`} />
        <Row label="Source" value={activity.source} last />
      </HeroCard>
      {activity.gpsUnavailableReason ? (
        <AppText variant="caption" color="rgba(255,255,255,0.5)" align="center" style={{ marginTop: theme.spacing.sm }}>
          {activity.gpsUnavailableReason}
        </AppText>
      ) : null}
      <AppGradientButton label="Done" onPress={() => navigation.popToTop()} colors={['#5B9BD5', '#2C5C87']} style={{ marginTop: theme.spacing.lg }} />
    </ActivityHeroLayout>
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
