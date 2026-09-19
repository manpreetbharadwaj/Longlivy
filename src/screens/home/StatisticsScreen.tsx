import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppMiniBarChart } from '@/components/common/AppMiniBarChart';
import { AppTrendBadge } from '@/components/common/AppTrendBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectStatisticsPeriod,
  selectFastingStatisticsForPeriod,
  selectActivityStatisticsForPeriod,
  selectMeditationStatisticsForPeriod,
  selectWeightStatisticsForPeriod,
} from '@/features/statistics/selectors';
import { setStatisticsPeriod, StatisticsPeriod } from '@/features/statistics/statisticsSlice';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

const PERIODS: { key: StatisticsPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'total', label: 'Total' },
];

export const StatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const period = useAppSelector(selectStatisticsPeriod);
  const fasting = useAppSelector(selectFastingStatisticsForPeriod);
  const activity = useAppSelector(selectActivityStatisticsForPeriod);
  const meditation = useAppSelector(selectMeditationStatisticsForPeriod);
  const weight = useAppSelector(selectWeightStatisticsForPeriod);

  return (
    <SectionHeroLayout
      environment={sectionEnvironments.statistics}
      title="Statistics"
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
    >
      <AppSegmentedControl variant="hero" segments={PERIODS} selectedKey={period} onChange={(k) => dispatch(setStatisticsPeriod(k as StatisticsPeriod))} />

      <SectionTitle>Fasting</SectionTitle>
      {fasting.hasData ? (
        <HeroCard style={[dashboardCardStyle, { marginBottom: theme.spacing.md }]}>
          <Row label="Sessions" value={`${fasting.sessionCount}`} />
          <Row label="Completed" value={`${fasting.completedCount}`} />
          <Row label="Total hours" value={`${fasting.totalHours}h`} />
          <Row label="Average" value={`${fasting.averageHours}h`} last />
          <AppTrendBadge percent={fasting.trend} />
          <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            Completed hours, last 7 days
          </AppText>
          <AppMiniBarChart data={fasting.dailySeries} color="#6E8DBE" />
        </HeroCard>
      ) : (
        <NoData />
      )}

      <SectionTitle>Activity</SectionTitle>
      {activity.hasData ? (
        <HeroCard style={[dashboardCardStyle, { marginBottom: theme.spacing.md }]}>
          <Row label="Activities" value={`${activity.activityCount}`} />
          <Row label="Distance" value={`${(activity.totalDistanceMeters / 1000).toFixed(1)} km`} />
          <Row label="Calories" value={`${activity.totalCalories}`} />
          <Row label="Duration" value={`${Math.round(activity.totalDurationMs / 60000)} min`} last />
          <AppTrendBadge percent={activity.trend} />
          <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            Calories burned, last 7 days
          </AppText>
          <AppMiniBarChart data={activity.dailySeries} color="#D98657" />
        </HeroCard>
      ) : (
        <NoData />
      )}

      <SectionTitle>Meditation</SectionTitle>
      {meditation.hasData ? (
        <HeroCard style={[dashboardCardStyle, { marginBottom: theme.spacing.md }]}>
          <Row label="Sessions" value={`${meditation.sessionCount}`} />
          <Row label="Total minutes" value={`${meditation.totalMinutes}`} />
          <Row label="Average" value={`${meditation.averageMinutes} min`} last />
          <AppTrendBadge percent={meditation.trend} />
          <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: theme.spacing.sm }}>
            Active minutes, last 7 days
          </AppText>
          <AppMiniBarChart data={meditation.dailySeries} color="#A186BD" />
        </HeroCard>
      ) : (
        <NoData />
      )}

      <SectionTitle>Weight</SectionTitle>
      {weight.hasData ? (
        <HeroCard style={dashboardCardStyle}>
          <Row label="Latest" value={`${weight.latest?.toFixed(1)} kg`} />
          <Row label="Change" value={`${weight.change > 0 ? '+' : ''}${weight.change} kg`} last />
          {weight.dailySeries.length ? (
            <>
              <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: theme.spacing.sm }}>
                Last 7 days
              </AppText>
              <AppMiniBarChart data={weight.dailySeries} color={dashboardColors.success} />
            </>
          ) : null}
        </HeroCard>
      ) : (
        <NoData />
      )}
    </SectionHeroLayout>
  );
};

const SectionTitle: React.FC<{ children: string }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
      {children}
    </AppText>
  );
};

const NoData: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[dashboardCardStyle, { padding: theme.spacing.md, marginBottom: theme.spacing.md, alignItems: 'center' }]}>
      <AppText variant="bodyMedium" color={dashboardColors.textMuted} align="center">
        No data available for this period.
      </AppText>
    </View>
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
        borderBottomColor: dashboardColors.border,
      }}
    >
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" weight="600" color={dashboardColors.textPrimary}>
        {value}
      </AppText>
    </View>
  );
};
