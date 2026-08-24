import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { loadActivityData } from '@/features/activity/activitySlice';
import { selectActiveActivity, selectActivityHistory, selectActivityStats } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { StartActivityCTA } from '@/features/activity/components/StartActivityCTA';
import { ActivitySummaryCard } from '@/features/activity/components/ActivitySummaryCard';
import { LogManuallyButton } from '@/features/activity/components/LogManuallyButton';
import { ActivityListItem } from '@/features/activity/components/ActivityListItem';
import { ActivityEmptyState } from '@/features/activity/components/ActivityEmptyState';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

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

  const recent = history.slice(0, 5);

  return (
    <TabHeroLayout title="Activity">
      {/* 1. Start Activity — the screen's primary action */}
      <FadeSlideIn delay={0 * motion.staggerStepMs}>
        {active ? (
          <HeroCard onPress={() => navigation.navigate('ActiveActivity')} style={[dashboardCardStyle, { marginBottom: theme.spacing.md }]} scaleOnPress>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dashboardColors.success, marginRight: theme.spacing.xs }} />
              <View style={{ flex: 1 }}>
                <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
                  {ACTIVITY_TYPE_LABELS[active.type]} in progress
                </AppText>
                <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
                  Tap to resume tracking
                </AppText>
              </View>
            </View>
          </HeroCard>
        ) : (
          <View style={{ marginBottom: theme.spacing.md }}>
            <StartActivityCTA onPress={() => navigation.navigate('SelectActivity')} />
          </View>
        )}
      </FadeSlideIn>

      {/* 2. Activity summary — one unified metrics card */}
      <FadeSlideIn delay={1 * motion.staggerStepMs}>
        <ActivitySummaryCard activities={stats.totalActivities} distanceKm={stats.totalDistanceMeters / 1000} calories={stats.totalCalories} />
      </FadeSlideIn>

      {/* 3. Log manually — secondary action */}
      <FadeSlideIn delay={2 * motion.staggerStepMs}>
        <View style={{ marginBottom: theme.spacing.md }}>
          <LogManuallyButton onPress={() => navigation.navigate('ManualActivity')} />
        </View>
      </FadeSlideIn>

      {/* 4. Recent activity */}
      <FadeSlideIn delay={3 * motion.staggerStepMs}>
        <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.sm }}>
          Recent activities
        </AppText>
      </FadeSlideIn>

      {recent.length === 0 ? (
        <FadeSlideIn delay={4 * motion.staggerStepMs}>
          <ActivityEmptyState onStart={() => navigation.navigate('SelectActivity')} />
        </FadeSlideIn>
      ) : (
        recent.map((a, index) => (
          <FadeSlideIn key={a.id} delay={4 * motion.staggerStepMs + index * motion.staggerStepMs} fromY={10}>
            <ActivityListItem activity={a} onPress={() => navigation.navigate('ActivityDetails', { activityId: a.id })} />
          </FadeSlideIn>
        ))
      )}

      <FadeSlideIn delay={4 * motion.staggerStepMs + recent.length * motion.staggerStepMs}>
        <HeroCard onPress={() => navigation.navigate('ActivityHistory')} style={[dashboardCardStyle, { paddingVertical: theme.spacing.sm }]} scaleOnPress>
          <AppText variant="headingSmall" color={dashboardColors.textSecondary} align="center">
            View full history
          </AppText>
        </HeroCard>
      </FadeSlideIn>
    </TabHeroLayout>
  );
};
