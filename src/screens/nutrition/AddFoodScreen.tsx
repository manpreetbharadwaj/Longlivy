import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Food } from '@/features/nutrition/models';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';
import { addFoodToMealThunk, loadFavoriteFoods } from '@/features/nutrition/nutritionSlice';
import { selectFavoriteFoods } from '@/features/nutrition/selectors';
import { selectActiveFast } from '@/features/fasting/selectors';
import { endFastThunk } from '@/features/fasting/fastingSlice';

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

  if (!food) return <AppLoader fullscreen />;

  return (
    <>
      <AppHeader
        title={food.name}
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable onPress={toggleFavorite} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'} hitSlop={8}>
            <AppIcon name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? theme.colors.secondary : theme.colors.textSecondary} />
          </Pressable>
        }
      />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          {food.brand ? `${food.brand} · ` : ''}
          {food.category}
        </AppText>

        <AppInput label={`Quantity (${food.unit})`} value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />

        {scaled ? (
          <AppCard style={{ marginBottom: theme.spacing.lg }}>
            <NutrientRow label="Calories" value={`${scaled.calories} kcal`} />
            <NutrientRow label="Protein" value={`${scaled.protein} g`} />
            <NutrientRow label="Carbohydrates" value={`${scaled.carbohydrates} g`} />
            <NutrientRow label="Fat" value={`${scaled.fat} g`} last={scaled.fiber === undefined} />
            {scaled.fiber !== undefined ? <NutrientRow label="Fiber" value={`${scaled.fiber} g`} last /> : null}
          </AppCard>
        ) : null}

        <AppButton label={`Add to ${route.params.mealType}`} onPress={handleAdd} loading={saving} />
      </AppScreen>
    </>
  );
};

const NutrientRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
};
