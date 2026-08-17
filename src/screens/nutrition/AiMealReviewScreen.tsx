import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppCard } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { AppChip } from '@/components/common/AppChip';
import { AppInput } from '@/components/common/AppInput';
import { AppIcon } from '@/components/common/AppIcon';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { addFoodToMealThunk } from '@/features/nutrition/nutritionSlice';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { MealType } from '@/features/nutrition/models';

const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

const SOURCE_LABEL: Record<string, string> = { photo: 'Photo', voice: 'Voice', text: 'Text' };

/**
 * The mandatory checkpoint between "AI recognized something" and "it's saved
 * as a real entry" — nothing from photo/voice/text recognition reaches the
 * food diary without passing through here first, and every value on screen
 * stays fully editable.
 */
export const AiMealReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const route = useRoute<RouteProp<NutritionStackParamList, 'AiMealReview'>>();
  const dispatch = useAppDispatch();
  const [mealType, setMealType] = useState<MealType>('snack');
  const [items, setItems] = useState(route.params.items.map((i) => ({ ...i, quantityText: String(i.quantity) })));
  const [saving, setSaving] = useState(false);

  const updateQuantity = useCallback((foodId: string, text: string) => {
    setItems((prev) => prev.map((i) => (i.foodId === foodId ? { ...i, quantityText: text } : i)));
  }, []);

  const removeItem = useCallback((foodId: string) => {
    setItems((prev) => prev.filter((i) => i.foodId !== foodId));
  }, []);

  const totalCalories = useMemo(
    () => items.reduce((sum, i) => sum + (i.calories * (Number(i.quantityText) || 0)) / (i.quantity || 1), 0),
    [items]
  );

  const handleSave = useCallback(async () => {
    if (items.length === 0) return;
    setSaving(true);
    for (const item of items) {
      const quantity = Number(item.quantityText) || item.quantity;
      const food = await nutritionRepository.getFoodById(item.foodId);
      if (!food) continue;
      await dispatch(addFoodToMealThunk({ mealType, food, quantity }));
    }
    setSaving(false);
    navigation.popToTop();
  }, [items, mealType, dispatch, navigation]);

  return (
    <>
      <AppHeader title="Review before saving" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <AppIcon name="information-circle-outline" size={18} color={theme.colors.info} />
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginLeft: theme.spacing.xxs, flex: 1 }}>
            {SOURCE_LABEL[route.params.source]}-based recognition is an estimate. Check and adjust each item before
            saving — nothing is stored automatically.
          </AppText>
        </View>

        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          Meal
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
          {MEAL_TYPES.map((mt) => (
            <AppChip key={mt.key} label={mt.label} selected={mealType === mt.key} onPress={() => setMealType(mt.key)} />
          ))}
        </View>

        {items.length === 0 ? (
          <AppText variant="bodyMedium" color={theme.colors.textTertiary} style={{ marginBottom: theme.spacing.md }}>
            No items left to save — go back to try again.
          </AppText>
        ) : (
          items.map((item) => (
            <AppCard key={item.foodId} style={{ marginBottom: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs }}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <AppText variant="headingSmall">{item.foodName}</AppText>
                  <AppBadge label={`${Math.round(item.confidence * 100)}% confidence`} tone={item.confidence >= 0.5 ? 'info' : 'warning'} />
                </View>
                <AppButton label="Remove" variant="ghost" fullWidth={false} onPress={() => removeItem(item.foodId)} style={{ height: 32 }} />
              </View>
              <AppInput
                label={`Quantity (${item.unit})`}
                value={item.quantityText}
                onChangeText={(t) => updateQuantity(item.foodId, t)}
                keyboardType="numeric"
              />
            </AppCard>
          ))
        )}

        {items.length > 0 ? (
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
            Estimated total: {Math.round(totalCalories)} kcal
          </AppText>
        ) : null}

        <AppButton label={`Save to ${mealType}`} onPress={handleSave} loading={saving} disabled={items.length === 0} />
      </AppScreen>
    </>
  );
};
