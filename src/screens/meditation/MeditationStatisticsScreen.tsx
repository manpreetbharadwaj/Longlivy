import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationStats, selectMeditationStreak } from '@/features/meditation/selectors';

export const MeditationStatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const stats = useAppSelector(selectMeditationStats);
  const streak = useAppSelector(selectMeditationStreak);

  const tiles = [
    { label: t('meditation.statisticsScreen.totalSessions'), value: `${stats.totalSessions}` },
    { label: t('meditation.statisticsScreen.totalTime'), value: `${Math.round(stats.totalActiveSeconds / 60)} min` },
    { label: t('meditation.statisticsScreen.averageDuration'), value: `${Math.round(stats.averageSeconds / 60)} min` },
    { label: t('meditation.statisticsScreen.longestSession'), value: `${Math.round(stats.longestSessionSeconds / 60)} min` },
    { label: t('meditation.statisticsScreen.currentStreak'), value: `${streak}d` },
  ];

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.statisticsScreen.title')} onBack={() => navigation.goBack()}>
      {stats.totalSessions === 0 ? (
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xl }}>
          {t('meditation.statisticsScreen.noData')}
        </AppText>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
          {tiles.map((tile) => (
            <View key={tile.label} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
              <HeroCard>
                <AppText variant="headingMedium" color="#FFFFFF">
                  {tile.value}
                </AppText>
                <AppText variant="caption" color="rgba(255,255,255,0.6)">
                  {tile.label}
                </AppText>
              </HeroCard>
            </View>
          ))}
        </View>
      )}
    </SectionHeroLayout>
  );
};
