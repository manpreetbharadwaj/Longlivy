import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';
import { motion } from '@/theme/motion';
import { loadActivityData } from '@/features/activity/activitySlice';
import { selectActiveActivity, selectActivityHistory, selectActivityStats } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { StartActivityCTA } from '@/features/activity/components/StartActivityCTA';
import { ActivitySummaryCard } from '@/features/activity/components/ActivitySummaryCard';
import { LogManuallyButton } from '@/features/activity/components/LogManuallyButton';
import { ActivityListItem } from '@/features/activity/components/ActivityListItem';
import { ActivityEmptyState } from '@/features/activity/components/ActivityEmptyState';
import { dashboardColors, dashboardCardStyle, dashboardCardElevated } from '@/features/dashboard/dashboardTheme';
import { ActivityHeroLayout } from './ActivityHeroLayout';

// Room the scrolling content leaves for the Start Activity footer, so the last
// list item is never hidden behind it.
const STICKY_CTA_ROOM = 108;

export const ActivityHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const dispatch = useAppDispatch();
  const active = useAppSelector(selectActiveActivity);
  const history = useAppSelector(selectActivityHistory);
  const stats = useAppSelector(selectActivityStats);
  const tabBarSpacing = useFloatingTabBarSpacing();

  useEffect(() => {
    dispatch(loadActivityData());
  }, [dispatch]);

  const recent = history.slice(0, 5);

  return (
    <View style={{ flex: 1 }}>
    <ActivityHeroLayout title={t('activity.title')} contentContainerStyle={{ paddingBottom: theme.spacing.xxxl + tabBarSpacing + STICKY_CTA_ROOM }}>
      {/* Activity summary — one unified metrics card */}
      <FadeSlideIn delay={0 * motion.staggerStepMs}>
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
          {t('activity.recentActivities')}
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
            {t('activity.viewFullHistory')}
          </AppText>
        </HeroCard>
      </FadeSlideIn>
    </ActivityHeroLayout>

      {/* Start Activity lives in the thumb zone - pinned just above the tab bar, always visible, one-handed. */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: theme.spacing.md, right: theme.spacing.md, bottom: tabBarSpacing + theme.spacing.xs }}>
        {active ? (
          <HeroCard onPress={() => navigation.navigate('ActiveActivity')} style={[dashboardCardElevated, { paddingVertical: theme.spacing.sm }]} scaleOnPress>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dashboardColors.success, marginRight: theme.spacing.xs }} />
              <View style={{ flex: 1 }}>
                <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
                  {t('activity.inProgress', { type: ACTIVITY_TYPE_LABELS[active.type] })}
                </AppText>
                <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
                  {t('activity.tapToResume')}
                </AppText>
              </View>
            </View>
          </HeroCard>
        ) : (
          <StartActivityCTA onPress={() => navigation.navigate('SelectActivity')} />
        )}
      </View>
    </View>
  );
};
