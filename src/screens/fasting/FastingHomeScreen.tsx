import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { HeroCard } from '@/components/common/HeroCard';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { selectActiveFast, selectFastingStats, selectFastingStatus } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { FastingHeroLayout } from './FastingHeroLayout';

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
    <FastingHeroLayout title="Fasting">
      {status === 'loading' && !activeFast ? (
        <AppLoader label="Loading fasting data…" />
      ) : (
        <>
          {activeFast && progress ? (
            <HeroCard onPress={() => navigation.navigate('ActiveFast')} style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
              <AppProgressRing progress={progress.progress} size={180} strokeWidth={14} color="#5FBFAE" trackColor="rgba(255,255,255,0.12)">
                <AppText variant="metricLarge" color="#FFFFFF">
                  {Math.round(Math.min(progress.progress, 1) * 100)}%
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {activeFast.method}
                </AppText>
              </AppProgressRing>
              <AppText variant="bodyMedium" color="#FFFFFF" style={{ marginTop: theme.spacing.sm }}>
                {formatDurationHM(progress.elapsedMs)} elapsed
              </AppText>
              <AppGradientButton label="View active fast" onPress={() => navigation.navigate('ActiveFast')} fullWidth={false} style={{ marginTop: theme.spacing.sm }} />
            </HeroCard>
          ) : (
            <HeroCard style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'rgba(95,191,174,0.18)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.sm,
                }}
              >
                <AppIcon name="timer-outline" size={30} color="#5FBFAE" />
              </View>
              <AppText variant="headingSmall" color="#FFFFFF">
                No active fast
              </AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginVertical: theme.spacing.sm }}>
                Choose a method and start tracking your fasting window.
              </AppText>
              <AppGradientButton label="Start fasting" onPress={() => navigation.navigate('SelectFastingMethod')} fullWidth={false} />
            </HeroCard>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
            <StatTile label="Current streak" value={`${stats.currentStreak}d`} />
            <StatTile label="Completed" value={`${stats.completedSessions}`} />
            <StatTile label="Avg. duration" value={formatDurationHM(stats.averageDurationMs)} />
            <StatTile label="Longest" value={formatDurationHM(stats.longestDurationMs)} />
          </View>

          <View style={{ marginTop: theme.spacing.md }}>
            <HeroCard onPress={() => navigation.navigate('FastingHistory')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                Fasting history
              </AppText>
            </HeroCard>
            <HeroCard onPress={() => navigation.navigate('FastingCalendar')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                Fasting calendar
              </AppText>
            </HeroCard>
            <HeroCard onPress={() => navigation.navigate('FastingStatistics')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                Fasting statistics
              </AppText>
            </HeroCard>
            <HeroCard onPress={() => navigation.navigate('FastingPlans')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                My fasting plans
              </AppText>
            </HeroCard>
            <HeroCard onPress={() => navigation.navigate('FastingSettings')} style={{ paddingVertical: theme.spacing.sm }}>
              <AppText variant="headingSmall" color="rgba(255,255,255,0.7)" align="center">
                Fasting settings
              </AppText>
            </HeroCard>
          </View>
        </>
      )}
    </FastingHeroLayout>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = React.memo(({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
      <HeroCard>
        <AppText variant="headingMedium" color="#FFFFFF">
          {value}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.6)">
          {label}
        </AppText>
      </HeroCard>
    </View>
  );
});
StatTile.displayName = 'StatTile';
