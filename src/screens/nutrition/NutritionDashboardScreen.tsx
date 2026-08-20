import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';
import { selectDailyNutritionTotals, selectNutritionProgress, selectTodayMeals } from '@/features/nutrition/selectors';
import { MealType } from '@/features/nutrition/models';

const MEAL_TYPES: { key: MealType; label: string; icon: AppIconName }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'cafe-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'fast-food-outline' },
  { key: 'snack', label: 'Snack', icon: 'nutrition-outline' },
];

const QUICK_LINKS: { label: string; nav: keyof NutritionStackParamList }[] = [
  { label: 'Scan barcode', nav: 'BarcodeScanner' },
  { label: 'AI photo', nav: 'AiPhotoEntry' },
  { label: 'AI voice', nav: 'AiVoiceEntry' },
  { label: 'AI text', nav: 'AiTextEntry' },
];

export const NutritionDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const dispatch = useAppDispatch();
  const meals = useAppSelector(selectTodayMeals);
  const totals = useAppSelector(selectDailyNutritionTotals);
  const progress = useAppSelector(selectNutritionProgress);
  const ringProgress = useAnimatedProgress(progress.calories.percentage / 100);

  useEffect(() => {
    dispatch(loadTodayMeals());
  }, [dispatch]);

  const mealFor = useCallback((type: MealType) => meals.find((m) => m.mealType === type), [meals]);

  return (
    <TabHeroLayout title="Nutrition">
      <HeroCard style={{ alignItems: 'center', marginBottom: theme.spacing.md, overflow: 'hidden' }}>
        <AppProgressRing progress={ringProgress} size={160} strokeWidth={14} color={progress.calories.exceeded ? '#E0A24E' : '#E7A868'} trackColor="rgba(255,255,255,0.12)" glow>
          <AnimatedNumberText value={Math.round(totals.calories)} variant="metricMedium" color="#FFFFFF" />
          <AppText variant="caption" color="rgba(255,255,255,0.6)">
            of {progress.calories.target} kcal
          </AppText>
        </AppProgressRing>
        <AppText variant="bodyMedium" style={{ marginTop: theme.spacing.sm }} color={progress.calories.exceeded ? '#E0A24E' : 'rgba(255,255,255,0.6)'}>
          {progress.calories.exceeded ? `Goal exceeded by ${Math.round(progress.calories.exceededBy)} kcal` : `${Math.round(progress.calories.remaining)} kcal remaining`}
        </AppText>
        <CardShimmer delay={400} />
      </HeroCard>

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <MacroTile index={0} label="Protein" icon="egg-outline" progress={progress.protein} color="#E7A868" />
        <MacroTile index={1} label="Carbs" icon="pizza-outline" progress={progress.carbohydrates} color="#6AA3DE" />
        <MacroTile index={2} label="Fat" icon="water-outline" progress={progress.fat} color="#B98CE0" />
      </View>

      {MEAL_TYPES.map((mt, index) => {
        const meal = mealFor(mt.key);
        return (
          <FadeSlideIn key={mt.key} delay={index * motion.staggerStepMs} fromY={8}>
            <HeroCard onPress={() => navigation.navigate('FoodSearch', { mealType: mt.key })} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
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
          </FadeSlideIn>
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

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md, marginHorizontal: -theme.spacing.xxs }}>
        {QUICK_LINKS.map((link) => (
          <View key={link.nav} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.xs }}>
            <HeroCard onPress={() => navigation.navigate(link.nav as never)} style={{ paddingVertical: theme.spacing.sm }} scaleOnPress>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                {link.label}
              </AppText>
            </HeroCard>
          </View>
        ))}
      </View>

      <View style={{ marginTop: theme.spacing.md }}>
        <HeroCard onPress={() => navigation.navigate('MyRecipes')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }} scaleOnPress>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            My recipes
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MyFoods')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }} scaleOnPress>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            My foods
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('Favorites')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }} scaleOnPress>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Favorites
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('NutritionGoalsScreen')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }} scaleOnPress>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Nutrition goals
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('NutritionHistory')} style={{ paddingVertical: theme.spacing.sm }} scaleOnPress>
          <AppText variant="headingSmall" color="rgba(255,255,255,0.7)" align="center">
            Nutrition history
          </AppText>
        </HeroCard>
      </View>
    </TabHeroLayout>
  );
};

const MacroTile: React.FC<{ index: number; label: string; icon: AppIconName; progress: { current: number; target: number; percentage: number; exceeded: boolean }; color: string }> = React.memo(
  ({ index, label, icon, progress, color }) => {
    const { theme } = useTheme();
    // Mirrors the Home dashboard's NutritionCard macro rows — same
    // useAnimatedProgress -> AppProgressBar chain, same per-macro colors, so
    // the two places the app shows macro progress stay visually consistent.
    // AppProgressBar already clamps its own fill to 100% regardless of how
    // far `percentage` (which the selector deliberately allows past 100 for
    // the "exceeded" text/color elsewhere) goes past that.
    const animatedFraction = useAnimatedProgress(progress.percentage / 100);
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8} style={{ flex: 1, marginRight: theme.spacing.xs }}>
        <HeroCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: theme.radius.sm,
                backgroundColor: `${color}26`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 5,
              }}
            >
              <AppIcon name={icon} size={12} color={color} />
            </View>
            <AppText variant="caption" color="rgba(255,255,255,0.6)">
              {label}
            </AppText>
          </View>
          <AppText variant="headingSmall" color={progress.exceeded ? '#E0A24E' : '#FFFFFF'}>
            <AnimatedNumberText value={Math.round(progress.current)} variant="headingSmall" color={progress.exceeded ? '#E0A24E' : '#FFFFFF'} />
            g
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.45)" style={{ marginBottom: theme.spacing.xs }}>
            / {progress.target}g
          </AppText>
          <AppProgressBar progress={animatedFraction} color={color} trackColor="rgba(255,255,255,0.12)" height={5} />
        </HeroCard>
      </FadeSlideIn>
    );
  }
);
MacroTile.displayName = 'MacroTile';
