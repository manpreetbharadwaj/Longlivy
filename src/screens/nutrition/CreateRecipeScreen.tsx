import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Food } from '@/features/nutrition/models';
import { generateId } from '@/utils/id';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';
import { selectCurrentUserId } from '@/features/auth/selectors';
import { useAppSelector } from '@/store/hooks';

const NUTRITION_GRADIENT = ['#C9974E', '#8F6A2E'] as const;
const RESULT_LIMIT = 12;

interface Ingredient {
  food: Food;
  /** Amount in the food's own unit, as typed. Defaults to one serving. */
  quantityText: string;
}

export const CreateRecipeScreen: React.FC = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [servings, setServings] = useState('4');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Food[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [saving, setSaving] = useState(false);

  // The same search the food picker uses: the user's own foods first, then the reference catalog.
  useEffect(() => {
    let cancelled = false;
    nutritionRepository
      .searchFoods(debouncedQuery)
      .then((foods) => {
        if (cancelled) return;
        setResults(foods.slice(0, RESULT_LIMIT));
        setSearchError(null);
      })
      .catch((e) => {
        if (!cancelled) setSearchError(e instanceof Error ? e.message : 'Foods could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const toggleFood = useCallback((food: Food) => {
    setIngredients((prev) =>
      prev.some((i) => i.food.id === food.id) ? prev.filter((i) => i.food.id !== food.id) : [...prev, { food, quantityText: String(food.servingSize) }],
    );
  }, []);

  const setQuantity = useCallback((foodId: string, quantityText: string) => {
    setIngredients((prev) => prev.map((i) => (i.food.id === foodId ? { ...i, quantityText } : i)));
  }, []);

  const totals = useMemo(
    () =>
      ingredients.reduce(
        (acc, { food, quantityText }) => {
          const scaled = scaleNutrition(food, Number(quantityText) || 0);
          return {
            calories: acc.calories + scaled.calories,
            protein: acc.protein + scaled.protein,
            carbohydrates: acc.carbohydrates + scaled.carbohydrates,
            fat: acc.fat + scaled.fat,
          };
        },
        { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
      ),
    [ingredients],
  );

  const quantitiesValid = ingredients.every((i) => Number(i.quantityText) > 0);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await nutritionRepository.saveRecipe({
        id: generateId('recipe'),
        userId: currentUserId,
        name: name || 'My recipe',
        ingredients: ingredients.map(({ food, quantityText }) => ({ foodId: food.id, foodName: food.name, quantity: Number(quantityText), unit: food.unit })),
        totalAmount: ingredients.reduce((s, i) => s + Number(i.quantityText), 0),
        servings: Number(servings) || 1,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbohydrates: totals.carbohydrates,
        totalFat: totals.fat,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Recipe not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [currentUserId, name, ingredients, servings, totals, navigation]);

  return (
    <TabHeroLayout title="Create recipe" onBack={() => navigation.goBack()}>
      <HeroTextField label="Recipe name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.sm }} />
      <HeroTextField label="Servings" value={servings} onChangeText={setServings} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />

      {ingredients.length > 0 ? (
        <>
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
            Ingredients
          </AppText>
          {ingredients.map(({ food, quantityText }) => (
            <HeroCard key={food.id} style={{ marginBottom: theme.spacing.xs, borderColor: '#5C7A94', borderWidth: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="bodyMedium" color="#FFFFFF" style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  {food.name}
                </AppText>
                <HeroTextField
                  value={quantityText}
                  onChangeText={(v) => setQuantity(food.id, v)}
                  keyboardType="numeric"
                  accessibilityLabel={`${food.name} amount in ${food.unit}`}
                  style={{ width: 72, textAlign: 'right' }}
                />
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginLeft: theme.spacing.xxs, width: 44 }}>
                  {food.unit}
                </AppText>
              </View>
            </HeroCard>
          ))}
        </>
      ) : null}

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
        Add ingredients
      </AppText>
      <HeroTextField value={query} onChangeText={setQuery} placeholder="Search foods" style={{ marginBottom: theme.spacing.sm }} />
      {searchError ? (
        <AppText variant="bodySmall" color="#F2A08F" style={{ marginBottom: theme.spacing.sm }}>
          {searchError}
        </AppText>
      ) : null}
      {!searchError && results.length === 0 ? (
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.sm }}>
          No foods found.
        </AppText>
      ) : null}
      {results.map((food, index) => {
        const selected = ingredients.some((i) => i.food.id === food.id);
        return (
          <FadeSlideIn key={food.id} delay={index * 40} fromY={6}>
            <HeroCard
              onPress={() => toggleFood(food)}
              scaleOnPress
              style={{
                marginBottom: theme.spacing.xs,
                borderColor: selected ? '#5C7A94' : 'rgba(255,255,255,0.14)',
                borderWidth: selected ? 2 : 1.5,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="bodyMedium" color="#FFFFFF" style={{ flex: 1, marginRight: theme.spacing.sm }}>
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

      <AppGradientButton
        label="Save recipe"
        onPress={save}
        disabled={!name || ingredients.length === 0 || !quantitiesValid}
        loading={saving}
        colors={NUTRITION_GRADIENT}
      />
    </TabHeroLayout>
  );
};
