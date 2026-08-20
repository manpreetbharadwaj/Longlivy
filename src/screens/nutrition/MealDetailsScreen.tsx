import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
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
      <TabHeroLayout title="Meal" onBack={() => navigation.goBack()}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <AppIcon name="fast-food-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Meal not found
          </AppText>
        </View>
      </TabHeroLayout>
    );
  }

  return (
    <TabHeroLayout title={meal.name} onBack={() => navigation.goBack()}>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AnimatedNumberText value={Math.round(meal.totalCalories)} variant="metricMedium" color="#FFFFFF" formatter={(n) => `${Math.round(n)} kcal`} />
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          P {Math.round(meal.protein)}g · C {Math.round(meal.carbohydrates)}g · F {Math.round(meal.fat)}g
        </AppText>
      </HeroCard>

      {meal.items.map((item, index) => (
        <FadeSlideIn key={item.id} delay={index * motion.staggerStepMs} fromY={8}>
          <HeroCard onPress={() => removeItem(item.id)} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                <AppText variant="headingSmall" color="#FFFFFF">
                  {item.foodName}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {item.quantity}
                  {item.unit} · tap to remove
                </AppText>
              </View>
              <AppText variant="bodyMedium" color="#FFFFFF">
                {Math.round(item.calories)} kcal
              </AppText>
            </View>
          </HeroCard>
        </FadeSlideIn>
      ))}
    </TabHeroLayout>
  );
};
