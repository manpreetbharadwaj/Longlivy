import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppSelector } from '@/store/hooks';
import { selectFastingStats } from '@/features/fasting/selectors';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

export const FastingStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const stats = useAppSelector(selectFastingStats);

  const tiles = [
    { label: t('fasting.statistics.totalSessions'), value: `${stats.totalSessions}` },
    { label: t('fasting.statistics.completed'), value: `${stats.completedSessions}` },
    { label: t('fasting.statistics.endedEarly'), value: `${stats.prematureSessions}` },
    { label: t('fasting.statistics.currentStreak'), value: `${stats.currentStreak}d` },
    { label: t('fasting.statistics.averageDuration'), value: formatDurationHM(stats.averageDurationMs) },
    { label: t('fasting.statistics.longestFast'), value: formatDurationHM(stats.longestDurationMs) },
    { label: t('fasting.statistics.shortestFast'), value: formatDurationHM(stats.shortestDurationMs) },
  ];

  return (
    <>
      <AppHeader title={t('fasting.menu.statistics')} onBack={() => navigation.goBack()} />
      <AppScreen belowHeader>
        {stats.totalSessions === 0 ? (
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.xl }}>
            {t('fasting.statistics.noData')}
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
