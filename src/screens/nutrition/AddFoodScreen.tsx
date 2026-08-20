import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Food } from '@/features/nutrition/models';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';
import { addFoodToMealThunk, loadFavoriteFoods } from '@/features/nutrition/nutritionSlice';
import { selectFavoriteFoods } from '@/features/nutrition/selectors';
import { selectActiveFast } from '@/features/fasting/selectors';
import { endFastThunk } from '@/features/fasting/fastingSlice';

const NUTRITION_GRADIENT = ['#E7A868', '#B4652A'] as const;

export const AddFoodScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const route = useRoute<RouteProp<NutritionStackParamList, 'AddFood'>>();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavoriteFoods);
  const activeFast = useAppSelector(selectActiveFast);
  const isFavorite = favorites.some((f) => f.id === route.params.foodId);
  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    nutritionRepository.getFoodById(route.params.foodId).then((f) => {
      setFood(f);
      if (f) setQuantity(String(f.servingSize));
    });
  }, [route.params.foodId]);

  useEffect(() => {
    dispatch(loadFavoriteFoods());
  }, [dispatch]);

  const scaled = useMemo(() => (food ? scaleNutrition(food, Number(quantity) || 0) : null), [food, quantity]);

  const handleAdd = useCallback(async () => {
    if (!food) return;
    setSaving(true);
    await dispatch(addFoodToMealThunk({ mealType: route.params.mealType as any, food, quantity: Number(quantity) || food.servingSize }));
    setSaving(false);

    // Fasting and nutrition stay logically separate — logging food never ends
    // a fast on its own. We only ever ask; a change to the fast happens only
    // if the user explicitly confirms it.
    if (activeFast) {
      Alert.alert(
        'You have an active fast',
        'Logging food usually means an eating window has started. End your current fast now?',
        [
          { text: 'Keep fasting', style: 'cancel', onPress: () => navigation.popToTop() },
          { text: 'End fast', style: 'destructive', onPress: () => { dispatch(endFastThunk(activeFast)); navigation.popToTop(); } },
        ]
      );
    } else {
      navigation.popToTop();
    }
  }, [dispatch, food, quantity, route.params.mealType, navigation, activeFast]);

  const toggleFavorite = useCallback(async () => {
    await nutritionRepository.toggleFavorite('user_demo_1', route.params.foodId);
    dispatch(loadFavoriteFoods());
  }, [dispatch, route.params.foodId]);

  if (!food) {
    return (
      <TabHeroLayout scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </TabHeroLayout>
    );
  }

  return (
    <TabHeroLayout
      title={food.name}
      onBack={() => navigation.goBack()}
      rightElement={
        <Pressable onPress={toggleFavorite} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'} hitSlop={8}>
          <AppIcon name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#E7C069' : 'rgba(255,255,255,0.6)'} />
        </Pressable>
      }
    >
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
        {food.brand ? `${food.brand} · ` : ''}
        {food.category}
      </AppText>

      <HeroTextField label={`Quantity (${food.unit})`} value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />

      {scaled ? (
        <HeroCard style={{ marginBottom: theme.spacing.lg }}>
          <NutrientRow index={0} label="Calories" value={scaled.calories} unit=" kcal" />
          <NutrientRow index={1} label="Protein" value={scaled.protein} unit=" g" />
          <NutrientRow index={2} label="Carbohydrates" value={scaled.carbohydrates} unit=" g" />
          <NutrientRow index={3} label="Fat" value={scaled.fat} unit=" g" last={scaled.fiber === undefined} />
          {scaled.fiber !== undefined ? <NutrientRow index={4} label="Fiber" value={scaled.fiber} unit=" g" last /> : null}
        </HeroCard>
      ) : null}

      <AppGradientButton label={`Add to ${route.params.mealType}`} onPress={handleAdd} loading={saving} colors={NUTRITION_GRADIENT} />
    </TabHeroLayout>
  );
};

const NutrientRow: React.FC<{ index: number; label: string; value: number; unit: string; last?: boolean }> = ({ index, label, value, unit, last }) => {
  const { theme } = useTheme();
  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: theme.spacing.xs,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
          {label}
        </AppText>
        <AppText variant="bodyMedium" color="#FFFFFF">
          <AnimatedNumberText value={value} variant="bodyMedium" color="#FFFFFF" />
          {unit}
        </AppText>
      </View>
    </FadeSlideIn>
  );
};
