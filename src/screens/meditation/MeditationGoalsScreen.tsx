import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AppLoader } from '@/components/common/AppLoader';
import { AppErrorState } from '@/components/common/AppErrorState';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGoalsThunk } from '@/features/goals/goalsSlice';
import { selectActiveGoals, selectGoalsError, selectGoalsStatus } from '@/features/goals/selectors';
import { selectTodayMeditationSeconds, selectMeditationHistory } from '@/features/meditation/selectors';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { calculateGoalProgress } from '@/features/nutrition/services/NutritionCalculationService';
import { isWithinPeriod } from '@/utils/date/period';

export const MeditationGoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const goalsStatus = useAppSelector(selectGoalsStatus);
  const goalsError = useAppSelector(selectGoalsError);
  const goals = useAppSelector(selectActiveGoals).filter((g) => g.type === 'meditation_minutes' || g.type === 'meditation_sessions');
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const history = useAppSelector(selectMeditationHistory);
  const weekSessions = history.filter((h) => isWithinPeriod(h.startedAt, 'week')).length;

  useEffect(() => {
    void dispatch(fetchGoalsThunk());
  }, [dispatch]);

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.goalsScreen.title')} onBack={() => navigation.goBack()}>
      {goalsStatus === 'loading' && goals.length === 0 ? <AppLoader label={t('common.loading')} /> : null}
      {goalsStatus === 'failed' && goals.length === 0 ? <AppErrorState message={goalsError ?? undefined} onRetry={() => void dispatch(fetchGoalsThunk())} /> : null}
      {goalsStatus === 'succeeded' && goals.length === 0 ? <AppEmptyState title={t('states.emptyTitle')} message={t('meditation.statisticsScreen.noData')} /> : null}
      {goals.map((goal) => {
        const current = goal.type === 'meditation_minutes' ? Math.round(todaySeconds / 60) : weekSessions;
        const progress = calculateGoalProgress(current, goal.target);
        return (
          <HeroCard key={goal.id} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {goal.type === 'meditation_minutes' ? t('meditation.goalsScreen.type.meditation_minutes') : t('meditation.goalsScreen.type.meditation_sessions')}
              </AppText>
              <AppText variant="bodyMedium" color="#FFFFFF">
                {current} / {goal.target} {goal.unit}
              </AppText>
            </View>
            <AppProgressBar progress={progress.percentage / 100} color={dashboardColors.accent} trackColor="rgba(255,255,255,0.12)" />
            {progress.exceeded ? (
              <AppText variant="caption" color="#6FA085" style={{ marginTop: 4 }}>
                {t('meditation.goalsScreen.goalExceeded')}
              </AppText>
            ) : null}
          </HeroCard>
        );
      })}
    </SectionHeroLayout>
  );
};
