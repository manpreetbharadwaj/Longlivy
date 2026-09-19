import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroChip } from '@/components/common/HeroChip';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { AppBadge } from '@/components/common/AppBadge';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { addFoodToMealThunk } from '@/features/nutrition/nutritionSlice';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { MealType } from '@/features/nutrition/models';

const NUTRITION_GRADIENT = ['#C9974E', '#8F6A2E'] as const;

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
    <TabHeroLayout title="Review before saving" onBack={() => navigation.goBack()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppIcon name="information-circle-outline" size={18} color="#6E8FAE" />
        <AppText variant="bodySmall" color="rgba(255,255,255,0.7)" style={{ marginLeft: theme.spacing.xxs, flex: 1 }}>
          {SOURCE_LABEL[route.params.source]}-based recognition is an estimate. Check and adjust each item before
          saving — nothing is stored automatically.
        </AppText>
      </View>

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
        Meal
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        {MEAL_TYPES.map((mt) => (
          <HeroChip key={mt.key} label={mt.label} selected={mealType === mt.key} onPress={() => setMealType(mt.key)} />
        ))}
      </View>

      {items.length === 0 ? (
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.5)" style={{ marginBottom: theme.spacing.md }}>
          No items left to save — go back to try again.
        </AppText>
      ) : (
        items.map((item, index) => (
          <FadeSlideIn key={item.foodId} delay={index * motion.staggerStepMs} fromY={8}>
            <HeroCard style={{ marginBottom: theme.spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.xs }}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <AppText variant="headingSmall" color="#FFFFFF">
                    {item.foodName}
                  </AppText>
                  <AppBadge label={`${Math.round(item.confidence * 100)}% confidence`} tone={item.confidence >= 0.5 ? 'info' : 'warning'} />
                </View>
                <Pressable onPress={() => removeItem(item.foodId)} accessibilityRole="button" hitSlop={8}>
                  <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
                    Remove
                  </AppText>
                </Pressable>
              </View>
              <HeroTextField
                label={`Quantity (${item.unit})`}
                value={item.quantityText}
                onChangeText={(t) => updateQuantity(item.foodId, t)}
                keyboardType="numeric"
              />
            </HeroCard>
          </FadeSlideIn>
        ))
      )}

      {items.length > 0 ? (
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
          Estimated total: <AnimatedNumberText value={Math.round(totalCalories)} variant="bodyMedium" color="rgba(255,255,255,0.7)" /> kcal
        </AppText>
      ) : null}

      <AppGradientButton label={`Save to ${mealType}`} onPress={handleSave} loading={saving} disabled={items.length === 0} colors={NUTRITION_GRADIENT} />
    </TabHeroLayout>
  );
};
