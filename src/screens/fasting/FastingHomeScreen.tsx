import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { HeroCard } from '@/components/common/HeroCard';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { selectActiveFast, selectFastingStats, selectFastingStatus } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

export const FastingHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const activeFast = useAppSelector(selectActiveFast);
  const status = useAppSelector(selectFastingStatus);
  const stats = useAppSelector(selectFastingStats);
  const progress = useFastingTimer(activeFast);

  useEffect(() => {
    dispatch(loadFastingData());
  }, [dispatch]);

  return (
    <TabHeroLayout title="Fasting">
      {status === 'loading' && !activeFast ? (
        <AppLoader label="Loading fasting data…" />
      ) : (
        <>
          {activeFast && progress ? (
            <HeroCard onPress={() => navigation.navigate('ActiveFast')} style={[dashboardCardStyle, { alignItems: 'center', marginBottom: theme.spacing.md }]} scaleOnPress>
              <AppProgressRing progress={progress.progress} size={180} strokeWidth={12} color={dashboardColors.accent} trackColor={dashboardColors.border} glow>
                <AppText variant="metricLarge" color={dashboardColors.textPrimary}>
                  {Math.round(Math.min(progress.progress, 1) * 100)}%
                </AppText>
                <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                  {activeFast.method}
                </AppText>
              </AppProgressRing>
              <AppText variant="bodyMedium" color={dashboardColors.textPrimary} style={{ marginTop: theme.spacing.sm }}>
                {formatDurationHM(progress.elapsedMs)} elapsed
              </AppText>
              <Pressable
                onPress={() => navigation.navigate('ActiveFast')}
                accessibilityRole="button"
                accessibilityLabel="View active fast"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: dashboardColors.accent,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: 10,
                  borderRadius: theme.radius.pill,
                  marginTop: theme.spacing.sm,
                }}
              >
                <AppText variant="bodyMedium" weight="700" color={dashboardColors.background}>
                  View active fast
                </AppText>
              </Pressable>
            </HeroCard>
          ) : (
            <HeroCard style={[dashboardCardStyle, { alignItems: 'center', marginBottom: theme.spacing.md, paddingVertical: theme.spacing.lg }]}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: dashboardColors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: dashboardColors.borderStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.sm,
                }}
              >
                <AppIcon name="timer-outline" size={32} color={dashboardColors.accent} />
              </View>
              <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
                No active fast
              </AppText>
              <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginVertical: theme.spacing.sm }}>
                Choose a method and start tracking your fasting window.
              </AppText>
              <Pressable
                onPress={() => navigation.navigate('SelectFastingMethod')}
                accessibilityRole="button"
                accessibilityLabel="Start fasting"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: dashboardColors.accent,
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: 12,
                  borderRadius: theme.radius.pill,
                }}
              >
                <AppText variant="bodyMedium" weight="700" color={dashboardColors.background}>
                  Start fasting
                </AppText>
              </Pressable>
            </HeroCard>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
            <StatTile index={0} label="Current streak" value={`${stats.currentStreak}d`} />
            <StatTile index={1} label="Completed" value={`${stats.completedSessions}`} />
            <StatTile index={2} label="Avg. duration" value={formatDurationHM(stats.averageDurationMs)} />
            <StatTile index={3} label="Longest" value={formatDurationHM(stats.longestDurationMs)} />
          </View>

          <View style={{ marginTop: theme.spacing.md }}>
            <ListRow index={0} icon="time-outline" label="Fasting history" onPress={() => navigation.navigate('FastingHistory')} />
            <ListRow index={1} icon="calendar-outline" label="Fasting calendar" onPress={() => navigation.navigate('FastingCalendar')} />
            <ListRow index={2} icon="stats-chart-outline" label="Fasting statistics" onPress={() => navigation.navigate('FastingStatistics')} />
            <ListRow index={3} icon="document-text-outline" label="My fasting plans" onPress={() => navigation.navigate('FastingPlans')} />
            <ListRow index={4} icon="settings-outline" label="Fasting settings" onPress={() => navigation.navigate('FastingSettings')} isLast />
          </View>
        </>
      )}
    </TabHeroLayout>
  );
};

const StatTile: React.FC<{ index: number; label: string; value: string }> = React.memo(({ index, label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
        <View style={[dashboardCardStyle, { padding: theme.spacing.sm }]}>
          <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
            {value}
          </AppText>
          <AppText variant="caption" color={dashboardColors.textMuted}>
            {label}
          </AppText>
        </View>
      </FadeSlideIn>
    </View>
  );
});
StatTile.displayName = 'StatTile';

const ListRow: React.FC<{ index: number; icon: AppIconName; label: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, label, onPress, isLast }) => {
    const { theme } = useTheme();
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            dashboardCardStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.sm,
              marginBottom: isLast ? 0 : theme.spacing.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: dashboardColors.surfaceSecondary,
              borderWidth: 1,
              borderColor: dashboardColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <AppIcon name={icon} size={18} color={dashboardColors.accent} />
          </View>
          <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary} style={{ flex: 1 }}>
            {label}
          </AppText>
          <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
        </Pressable>
      </FadeSlideIn>
    );
  }
);
ListRow.displayName = 'ListRow';
