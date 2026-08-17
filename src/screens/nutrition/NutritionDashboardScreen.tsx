import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppCard } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppIconTile } from '@/components/common/AppIconTile';
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
    <AppScreen>
      <AppText variant="displayMedium" style={{ marginBottom: theme.spacing.md }}>
        Nutrition
      </AppText>

      <AppCard style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppProgressRing
          progress={progress.calories.percentage / 100}
          size={160}
          strokeWidth={14}
          color={progress.calories.exceeded ? theme.colors.warning : theme.colors.nutrition}
        >
          <AppText variant="metricMedium">{Math.round(totals.calories)}</AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            of {progress.calories.target} kcal
          </AppText>
        </AppProgressRing>
        <AppText variant="bodyMedium" style={{ marginTop: theme.spacing.sm }} color={progress.calories.exceeded ? theme.colors.warning : theme.colors.textSecondary}>
          {progress.calories.exceeded ? `Goal exceeded by ${Math.round(progress.calories.exceededBy)} kcal` : `${Math.round(progress.calories.remaining)} kcal remaining`}
        </AppText>
      </AppCard>

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <MacroTile label="Protein" progress={progress.protein} color={theme.colors.nutrition} />
        <MacroTile label="Carbs" progress={progress.carbohydrates} color={theme.colors.info} />
        <MacroTile label="Fat" progress={progress.fat} color={theme.colors.secondary} />
      </View>

      {MEAL_TYPES.map((mt) => {
        const meal = mealFor(mt.key);
        return (
          <AppCard key={mt.key} onPress={() => navigation.navigate('FoodSearch', { mealType: mt.key })} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppIconTile name={mt.icon} color={theme.colors.nutrition} size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
                <View>
                  <AppText variant="headingSmall">{mt.label}</AppText>
                  <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                    {meal ? `${Math.round(meal.totalCalories)} kcal · ${meal.items.length} items` : 'No items logged'}
                  </AppText>
                </View>
              </View>
              <AppIcon name="add-circle-outline" size={26} color={theme.colors.primary} />
            </View>
          </AppCard>
        );
      })}

      {meals.length === 0 ? <AppEmptyState title="Nothing logged yet" message="Add your first meal to see today's nutrition." /> : null}

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <AppButton label="Scan barcode" onPress={() => navigation.navigate('BarcodeScanner')} variant="outline" style={{ flex: 1, marginRight: theme.spacing.xs }} />
        <AppButton label="AI photo" onPress={() => navigation.navigate('AiPhotoEntry')} variant="outline" style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <AppButton label="AI voice" onPress={() => navigation.navigate('AiVoiceEntry')} variant="outline" style={{ flex: 1, marginRight: theme.spacing.xs }} />
        <AppButton label="AI text" onPress={() => navigation.navigate('AiTextEntry')} variant="outline" style={{ flex: 1 }} />
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <AppButton label="My recipes" onPress={() => navigation.navigate('MyRecipes')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="My foods" onPress={() => navigation.navigate('MyFoods')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Favorites" onPress={() => navigation.navigate('Favorites')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Nutrition goals" onPress={() => navigation.navigate('NutritionGoalsScreen')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Nutrition history" onPress={() => navigation.navigate('NutritionHistory')} variant="ghost" />
      </View>
    </AppScreen>
  );
};

const MacroTile: React.FC<{ label: string; progress: { current: number; target: number; percentage: number; exceeded: boolean }; color: string }> = React.memo(
  ({ label, progress, color }) => {
    const { theme } = useTheme();
    return (
      <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
        <AppCard>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {label}
          </AppText>
          <AppText variant="headingSmall" color={progress.exceeded ? theme.colors.warning : theme.colors.textPrimary}>
            {Math.round(progress.current)}g
          </AppText>
          <AppText variant="caption" color={theme.colors.textTertiary}>
            / {progress.target}g
          </AppText>
        </AppCard>
      </View>
    );
  }
);
MacroTile.displayName = 'MacroTile';
