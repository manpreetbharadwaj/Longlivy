import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationStats, selectMeditationStreak } from '@/features/meditation/selectors';

export const MeditationStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const stats = useAppSelector(selectMeditationStats);
  const streak = useAppSelector(selectMeditationStreak);

  const tiles = [
    { label: 'Total sessions', value: `${stats.totalSessions}` },
    { label: 'Total time', value: `${Math.round(stats.totalActiveSeconds / 60)} min` },
    { label: 'Average duration', value: `${Math.round(stats.averageSeconds / 60)} min` },
    { label: 'Longest session', value: `${Math.round(stats.longestSessionSeconds / 60)} min` },
    { label: 'Current streak', value: `${streak}d` },
  ];

  return (
    <>
      <AppHeader title="Meditation statistics" onBack={() => navigation.goBack()} />
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
