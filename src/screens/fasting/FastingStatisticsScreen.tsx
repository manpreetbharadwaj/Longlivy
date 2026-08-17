import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectFastingStats } from '@/features/fasting/selectors';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

export const FastingStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const stats = useAppSelector(selectFastingStats);

  const tiles = [
    { label: 'Total sessions', value: `${stats.totalSessions}` },
    { label: 'Completed', value: `${stats.completedSessions}` },
    { label: 'Ended early', value: `${stats.prematureSessions}` },
    { label: 'Current streak', value: `${stats.currentStreak}d` },
    { label: 'Average duration', value: formatDurationHM(stats.averageDurationMs) },
    { label: 'Longest fast', value: formatDurationHM(stats.longestDurationMs) },
    { label: 'Shortest fast', value: formatDurationHM(stats.shortestDurationMs) },
  ];

  return (
    <>
      <AppHeader title="Fasting statistics" onBack={() => navigation.goBack()} />
      <AppScreen>
        {stats.totalSessions === 0 ? (
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.xl }}>
            No data available yet.
          </AppText>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
            {tiles.map((tile) => (
              <View key={tile.label} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
                <AppCard>
                  <AppText variant="headingMedium">{tile.value}</AppText>
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    {tile.label}
                  </AppText>
                </AppCard>
              </View>
            ))}
          </View>
        )}
      </AppScreen>
    </>
  );
};
