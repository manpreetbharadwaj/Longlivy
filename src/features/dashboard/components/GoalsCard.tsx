import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveGoals } from '@/features/goals/selectors';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectTodayMeditationSeconds } from '@/features/meditation/selectors';
import { calculateGoalProgress } from '@/features/nutrition/services/NutritionCalculationService';

export const GoalsCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const goals = useAppSelector(selectActiveGoals);
  const nutritionTotals = useAppSelector(selectDailyNutritionTotals);
  const activityCalories = useAppSelector(selectTodayActivityCalories);
  const meditationSeconds = useAppSelector(selectTodayMeditationSeconds);

  const currentValueFor = useCallback(
    (type: string): number => {
      switch (type) {
        case 'calories':
          return nutritionTotals.calories;
        case 'protein':
          return nutritionTotals.protein;
        case 'activity_minutes':
          return activityCalories > 0 ? 1 : 0; // placeholder proxy without a duration selector here
        case 'meditation_minutes':
          return Math.round(meditationSeconds / 60);
        default:
          return 0;
      }
    },
    [nutritionTotals, activityCalories, meditationSeconds]
  );

  const dailyGoals = goals.filter((g) => g.period === 'day').slice(0, 3);

  return (
    <HeroCard onPress={() => navigation.navigate('Goals')} style={{ marginBottom: theme.spacing.sm }}>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
        Today's goals
      </AppText>
      {dailyGoals.map((goal) => {
        const progress = calculateGoalProgress(currentValueFor(goal.type), goal.target);
        return (
          <View key={goal.id} style={{ marginBottom: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <AppText variant="bodySmall" style={{ textTransform: 'capitalize' }} color="rgba(255,255,255,0.6)">
                {goal.type.replace('_', ' ')}
              </AppText>
              <AppText variant="bodySmall" color="#FFFFFF">
                {Math.round(progress.current)} / {goal.target} {goal.unit}
              </AppText>
            </View>
            <AppProgressBar progress={progress.percentage / 100} color={progress.exceeded ? '#4FB77E' : '#5FBFAE'} trackColor="rgba(255,255,255,0.12)" height={6} />
          </View>
        );
      })}
    </HeroCard>
  );
});

GoalsCard.displayName = 'GoalsCard';
