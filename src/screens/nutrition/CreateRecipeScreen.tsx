import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { FOOD_DATABASE_SEED } from '@/mock/foodDatabaseSeed';
import { generateId } from '@/utils/id';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';

const NUTRITION_GRADIENT = ['#E7A868', '#B4652A'] as const;

export const CreateRecipeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [servings, setServings] = useState('4');
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleFood = useCallback((id: string) => {
    setSelectedFoodIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const ingredients = useMemo(() => FOOD_DATABASE_SEED.filter((f) => selectedFoodIds.includes(f.id)), [selectedFoodIds]);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (acc, food) => {
        const scaled = scaleNutrition(food, food.servingSize);
        return {
          calories: acc.calories + scaled.calories,
          protein: acc.protein + scaled.protein,
          carbohydrates: acc.carbohydrates + scaled.carbohydrates,
          fat: acc.fat + scaled.fat,
        };
      },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
    );
  }, [ingredients]);

  const save = useCallback(async () => {
    setSaving(true);
    await nutritionRepository.saveRecipe({
      id: generateId('recipe'),
      userId: DEMO_USER_ID,
      name: name || 'My recipe',
      ingredients: ingredients.map((f) => ({ foodId: f.id, foodName: f.name, quantity: f.servingSize, unit: f.unit })),
      totalAmount: ingredients.reduce((s, f) => s + f.servingSize, 0),
      servings: Number(servings) || 1,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbohydrates: totals.carbohydrates,
      totalFat: totals.fat,
    });
    setSaving(false);
    navigation.goBack();
  }, [name, ingredients, servings, totals, navigation]);

  return (
    <TabHeroLayout title="Create recipe" onBack={() => navigation.goBack()}>
      <HeroTextField label="Recipe name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.sm }} />
      <HeroTextField label="Servings" value={servings} onChangeText={setServings} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
        Ingredients
      </AppText>
      {FOOD_DATABASE_SEED.slice(0, 8).map((food, index) => {
        const selected = selectedFoodIds.includes(food.id);
        return (
          <FadeSlideIn key={food.id} delay={index * 40} fromY={6}>
            <HeroCard
              onPress={() => toggleFood(food.id)}
              scaleOnPress
              style={{
                marginBottom: theme.spacing.xs,
                borderColor: selected ? '#5FBFAE' : 'rgba(255,255,255,0.14)',
                borderWidth: selected ? 2 : 1.5,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="bodyMedium" color="#FFFFFF">
                  {food.name}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {food.calories} kcal / {food.servingSize}
                  {food.unit}
                </AppText>
              </View>
            </HeroCard>
          </FadeSlideIn>
        );
      })}

      {ingredients.length > 0 ? (
        <HeroCard style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xxs }}>
            Totals ({servings || 1} servings)
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
            <AnimatedNumberText value={Math.round(totals.calories)} variant="bodySmall" color="rgba(255,255,255,0.6)" /> kcal total ·{' '}
            {Math.round(totals.calories / (Number(servings) || 1))} kcal/serving
          </AppText>
        </HeroCard>
      ) : null}

      <AppGradientButton label="Save recipe" onPress={save} disabled={!name || ingredients.length === 0} loading={saving} colors={NUTRITION_GRADIENT} />
    </TabHeroLayout>
  );
};
