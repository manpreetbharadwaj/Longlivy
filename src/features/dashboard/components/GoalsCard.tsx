import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { selectActiveGoals, selectGoalsStatus } from '@/features/goals/selectors';
import { fetchGoalsThunk } from '@/features/goals/goalsSlice';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectTodayMeditationSeconds } from '@/features/meditation/selectors';
import { calculateGoalProgress } from '@/features/nutrition/services/NutritionCalculationService';
import { dashboardColors, dashboardCardElevated } from '../dashboardTheme';

export const GoalsCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectActiveGoals);
  const goalsStatus = useAppSelector(selectGoalsStatus);
  const nutritionTotals = useAppSelector(selectDailyNutritionTotals);
  const activityCalories = useAppSelector(selectTodayActivityCalories);
  const meditationSeconds = useAppSelector(selectTodayMeditationSeconds);

  // Goals were otherwise only fetched by the Goals screens, so this card stayed
  // empty until one of them had been opened.
  useEffect(() => {
    if (goalsStatus === 'idle') void dispatch(fetchGoalsThunk());
  }, [dispatch, goalsStatus]);

  const currentValueFor = useCallback(
    (type: string): number => {
      switch (type) {
        // The server's calculated targets use the `nutrition_*` goal types.
        case 'calories':
        case 'nutrition_calories':
          return nutritionTotals.calories;
        case 'protein':
        case 'nutrition_protein':
          return nutritionTotals.protein;
        case 'carbohydrates':
        case 'nutrition_carbs':
          return nutritionTotals.carbohydrates;
        case 'fat':
        case 'nutrition_fat':
          return nutritionTotals.fat;
        case 'fiber':
        case 'nutrition_fiber':
          return nutritionTotals.fiber;
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
    <HeroCard onPress={() => navigation.navigate('Goals')} style={[dashboardCardElevated, { marginBottom: theme.spacing.sm }]} scaleOnPress>
      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.sm }}>
        Today's goals
      </AppText>
      {dailyGoals.length === 0 ? (
        <AppText variant="bodySmall" color={dashboardColors.textMuted}>
          No daily goals yet. Tap to see all your goals.
        </AppText>
      ) : null}
      {dailyGoals.map((goal, index) => {
        const progress = calculateGoalProgress(currentValueFor(goal.type), goal.target);
        return <GoalRow key={goal.id} index={index} type={goal.type} current={progress.current} target={goal.target} unit={goal.unit} percentage={progress.percentage} exceeded={progress.exceeded} />;
      })}
    </HeroCard>
  );
});

GoalsCard.displayName = 'GoalsCard';

const GoalRow: React.FC<{ index: number; type: string; current: number; target: number; unit: string; percentage: number; exceeded: boolean }> = React.memo(
  ({ index, type, current, target, unit, percentage, exceeded }) => {
    const { theme } = useTheme();
    const animatedFraction = useAnimatedProgress(percentage / 100);
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <View style={{ marginBottom: theme.spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <AppText variant="bodySmall" style={{ textTransform: 'capitalize' }} color={dashboardColors.textMuted}>
              {type.replace('_', ' ')}
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textPrimary}>
              <AnimatedNumberText value={Math.round(current)} variant="bodySmall" color={dashboardColors.textPrimary} />
              {` / ${target} ${unit}`}
            </AppText>
          </View>
          <AppProgressBar progress={animatedFraction} color={exceeded ? dashboardColors.success : dashboardColors.accent} trackColor={dashboardColors.border} height={6} />
        </View>
      </FadeSlideIn>
    );
  }
);
GoalRow.displayName = 'GoalRow';
