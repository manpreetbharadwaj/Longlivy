import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';
import { selectDailyNutritionTotals, selectNutritionProgress, selectTodayMeals } from '@/features/nutrition/selectors';
import { MealType } from '@/features/nutrition/models';

const MEAL_TYPES: { key: MealType; label: string; icon: AppIconName }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'cafe-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'fast-food-outline' },
  { key: 'snack', label: 'Snack', icon: 'nutrition-outline' },
];

export const NutritionDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const dispatch = useAppDispatch();
  const meals = useAppSelector(selectTodayMeals);
  const totals = useAppSelector(selectDailyNutritionTotals);
  const progress = useAppSelector(selectNutritionProgress);

  useEffect(() => {
    dispatch(loadTodayMeals());
  }, [dispatch]);

  const mealFor = useCallback((type: MealType) => meals.find((m) => m.mealType === type), [meals]);

  return (
    <TabHeroLayout title="Nutrition">
      <HeroCard style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppProgressRing
          progress={progress.calories.percentage / 100}
          size={160}
          strokeWidth={14}
          color={progress.calories.exceeded ? '#E0A24E' : '#E7A868'}
          trackColor="rgba(255,255,255,0.12)"
        >
          <AppText variant="metricMedium" color="#FFFFFF">
            {Math.round(totals.calories)}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.6)">
            of {progress.calories.target} kcal
          </AppText>
        </AppProgressRing>
        <AppText variant="bodyMedium" style={{ marginTop: theme.spacing.sm }} color={progress.calories.exceeded ? '#E0A24E' : 'rgba(255,255,255,0.6)'}>
          {progress.calories.exceeded ? `Goal exceeded by ${Math.round(progress.calories.exceededBy)} kcal` : `${Math.round(progress.calories.remaining)} kcal remaining`}
        </AppText>
      </HeroCard>

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <MacroTile label="Protein" progress={progress.protein} color="#E7A868" />
        <MacroTile label="Carbs" progress={progress.carbohydrates} color="#6AA3DE" />
        <MacroTile label="Fat" progress={progress.fat} color="#B98CE0" />
      </View>

      {MEAL_TYPES.map((mt) => {
        const meal = mealFor(mt.key);
        return (
          <HeroCard key={mt.key} onPress={() => navigation.navigate('FoodSearch', { mealType: mt.key })} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: theme.radius.md,
                    backgroundColor: 'rgba(231,168,104,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing.sm,
                  }}
                >
                  <AppIcon name={mt.icon} size={20} color="#E7A868" />
                </View>
                <View>
                  <AppText variant="headingSmall" color="#FFFFFF">
                    {mt.label}
                  </AppText>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                    {meal ? `${Math.round(meal.totalCalories)} kcal · ${meal.items.length} items` : 'No items logged'}
                  </AppText>
                </View>
              </View>
              <AppIcon name="add-circle-outline" size={26} color="#5FBFAE" />
            </View>
          </HeroCard>
        );
      })}

      {meals.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Nothing logged yet
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            Add your first meal to see today's nutrition.
          </AppText>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => navigation.navigate('BarcodeScanner')} style={{ paddingVertical: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              Scan barcode
            </AppText>
          </HeroCard>
        </View>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => navigation.navigate('AiPhotoEntry')} style={{ paddingVertical: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              AI photo
            </AppText>
          </HeroCard>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => navigation.navigate('AiVoiceEntry')} style={{ paddingVertical: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              AI voice
            </AppText>
          </HeroCard>
        </View>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => navigation.navigate('AiTextEntry')} style={{ paddingVertical: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              AI text
            </AppText>
          </HeroCard>
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <HeroCard onPress={() => navigation.navigate('MyRecipes')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            My recipes
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MyFoods')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            My foods
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('Favorites')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Favorites
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('NutritionGoalsScreen')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Nutrition goals
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('NutritionHistory')} style={{ paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="rgba(255,255,255,0.7)" align="center">
            Nutrition history
          </AppText>
        </HeroCard>
      </View>
    </TabHeroLayout>
  );
};

const MacroTile: React.FC<{ label: string; progress: { current: number; target: number; percentage: number; exceeded: boolean }; color: string }> = React.memo(
  ({ label, progress, color }) => {
    const { theme } = useTheme();
    return (
      <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
        <HeroCard>
          <AppText variant="caption" color="rgba(255,255,255,0.6)">
            {label}
          </AppText>
          <AppText variant="headingSmall" color={progress.exceeded ? '#E0A24E' : '#FFFFFF'}>
            {Math.round(progress.current)}g
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.45)">
            / {progress.target}g
          </AppText>
        </HeroCard>
      </View>
    );
  }
);
MacroTile.displayName = 'MacroTile';
