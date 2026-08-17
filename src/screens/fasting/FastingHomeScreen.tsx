import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { selectActiveFast, selectFastingStats, selectFastingStatus } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

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

  if (status === 'loading' && !activeFast) return <AppLoader fullscreen label="Loading fasting data…" />;

  return (
    <AppScreen>
      <AppText variant="displayMedium" style={{ marginBottom: theme.spacing.md }}>
        Fasting
      </AppText>

      {activeFast && progress ? (
        <AppCard onPress={() => navigation.navigate('ActiveFast')} style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
          <AppProgressRing progress={progress.progress} size={180} strokeWidth={14} color={theme.colors.fasting}>
            <AppText variant="metricLarge">{Math.round(Math.min(progress.progress, 1) * 100)}%</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {activeFast.method}
            </AppText>
          </AppProgressRing>
          <AppText variant="bodyMedium" style={{ marginTop: theme.spacing.sm }}>
            {formatDurationHM(progress.elapsedMs)} elapsed
          </AppText>
          <AppButton label="View active fast" onPress={() => navigation.navigate('ActiveFast')} fullWidth={false} style={{ marginTop: theme.spacing.sm }} />
        </AppCard>
      ) : (
        <AppCard style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
          <AppIconTile name="timer-outline" shape="circle" color={theme.colors.fasting} size={64} iconSize={30} style={{ marginBottom: theme.spacing.sm }} />
          <AppText variant="headingSmall">No active fast</AppText>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginVertical: theme.spacing.sm }}>
            Choose a method and start tracking your fasting window.
          </AppText>
          <AppButton label="Start fasting" onPress={() => navigation.navigate('SelectFastingMethod')} fullWidth={false} />
        </AppCard>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
        <StatTile label="Current streak" value={`${stats.currentStreak}d`} />
        <StatTile label="Completed" value={`${stats.completedSessions}`} />
        <StatTile label="Avg. duration" value={formatDurationHM(stats.averageDurationMs)} />
        <StatTile label="Longest" value={formatDurationHM(stats.longestDurationMs)} />
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <AppButton label="Fasting history" onPress={() => navigation.navigate('FastingHistory')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Fasting calendar" onPress={() => navigation.navigate('FastingCalendar')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Fasting statistics" onPress={() => navigation.navigate('FastingStatistics')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="My fasting plans" onPress={() => navigation.navigate('FastingPlans')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Fasting settings" onPress={() => navigation.navigate('FastingSettings')} variant="ghost" />
      </View>
    </AppScreen>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
      <AppCard>
        <AppText variant="headingMedium">{value}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {label}
        </AppText>
      </AppCard>
    </View>
  );
});
StatTile.displayName = 'StatTile';
