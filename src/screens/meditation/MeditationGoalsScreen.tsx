import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveGoals } from '@/features/goals/selectors';
import { selectTodayMeditationSeconds, selectMeditationHistory } from '@/features/meditation/selectors';
import { calculateGoalProgress } from '@/features/nutrition/services/NutritionCalculationService';
import { isWithinPeriod } from '@/utils/date/period';

export const MeditationGoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const goals = useAppSelector(selectActiveGoals).filter((g) => g.type === 'meditation_minutes' || g.type === 'meditation_sessions');
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const history = useAppSelector(selectMeditationHistory);
  const weekSessions = history.filter((h) => isWithinPeriod(h.startedAt, 'week')).length;

  return (
    <>
      <AppHeader title="Meditation goals" onBack={() => navigation.goBack()} />
      <AppScreen>
        {goals.map((goal) => {
          const current = goal.type === 'meditation_minutes' ? Math.round(todaySeconds / 60) : weekSessions;
          const progress = calculateGoalProgress(current, goal.target);
          return (
            <AppCard key={goal.id} style={{ marginBottom: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                <AppText variant="headingSmall" style={{ textTransform: 'capitalize' }}>
                  {goal.type.replace('_', ' ')}
                </AppText>
                <AppText variant="bodyMedium">
                  {current} / {goal.target} {goal.unit}
                </AppText>
              </View>
              <AppProgressBar progress={progress.percentage / 100} color={theme.colors.meditation} />
              {progress.exceeded ? (
                <AppText variant="caption" color={theme.colors.success} style={{ marginTop: 4 }}>
                  Goal exceeded
                </AppText>
              ) : null}
            </AppCard>
          );
        })}
      </AppScreen>
    </>
  );
};
