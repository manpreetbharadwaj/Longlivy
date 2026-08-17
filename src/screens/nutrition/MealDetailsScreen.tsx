import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppCard } from '@/components/common/AppCard';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectTodayMeals } from '@/features/nutrition/selectors';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';

export const MealDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<NutritionStackParamList, 'MealDetails'>>();
  const dispatch = useAppDispatch();
  const meals = useAppSelector(selectTodayMeals);
  const meal = meals.find((m) => m.id === route.params.mealId);

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!meal) return;
      await nutritionRepository.removeMealItem(meal.id, itemId);
      dispatch(loadTodayMeals());
    },
    [meal, dispatch]
  );

  if (!meal) {
    return (
      <>
        <AppHeader title="Meal" onBack={() => navigation.goBack()} />
        <AppScreen>
          <AppEmptyState title="Meal not found" />
        </AppScreen>
      </>
    );
  }

  return (
    <>
      <AppHeader title={meal.name} onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="metricMedium">{Math.round(meal.totalCalories)} kcal</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            P {Math.round(meal.protein)}g · C {Math.round(meal.carbohydrates)}g · F {Math.round(meal.fat)}g
          </AppText>
        </AppCard>

        {meal.items.map((item) => (
          <AppCard key={item.id} onPress={() => removeItem(item.id)} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                <AppText variant="headingSmall">{item.foodName}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {item.quantity}
                  {item.unit} · tap to remove
                </AppText>
              </View>
              <AppText variant="bodyMedium">{Math.round(item.calories)} kcal</AppText>
            </View>
          </AppCard>
        ))}
      </AppScreen>
    </>
  );
};
