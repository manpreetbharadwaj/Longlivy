import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectTodayMeals } from '@/features/nutrition/selectors';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';
import { MealItem } from '@/features/nutrition/models';

const DANGER_GRADIENT = ['#DD7A68', '#C4463A'] as const;

export const MealDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<NutritionStackParamList, 'MealDetails'>>();
  const dispatch = useAppDispatch();
  const meals = useAppSelector(selectTodayMeals);
  const meal = meals.find((m) => m.id === route.params.mealId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quantityText, setQuantityText] = useState('');
  const [busy, setBusy] = useState(false);
  // One write at a time: a double tap must not send two requests.
  const busyRef = useRef(false);

  const run = useCallback(
    async (failureTitle: string, action: () => Promise<unknown>, after?: () => void) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        await action();
        await dispatch(loadTodayMeals());
        after?.();
      } catch (e) {
        Alert.alert(failureTitle, e instanceof Error ? e.message : 'Please try again.');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [dispatch],
  );

  const startEdit = useCallback((item: MealItem) => {
    setEditingId(item.id);
    setQuantityText(String(item.quantity));
  }, []);

  const saveQuantity = useCallback(
    (item: MealItem) => {
      const quantity = Number(quantityText.replace(',', '.'));
      if (!meal || !(quantity > 0)) return;
      void run('Amount not updated', () => nutritionRepository.updateMealItemQuantity(meal.id, item.id, quantity), () => setEditingId(null));
    },
    [meal, quantityText, run],
  );

  const removeItem = useCallback(
    (item: MealItem) => {
      if (!meal) return;
      Alert.alert(`Remove ${item.foodName}?`, undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void run('Could not remove item', () => nutritionRepository.removeMealItem(meal.id, item.id), () => setEditingId(null)) },
      ]);
    },
    [meal, run],
  );

  const deleteMeal = useCallback(() => {
    if (!meal) return;
    Alert.alert(`Delete ${meal.name}?`, 'All foods logged in this meal will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void run('Meal not deleted', () => nutritionRepository.deleteMeal(meal.id), () => navigation.goBack()) },
    ]);
  }, [meal, run, navigation]);

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

      {meal.items.map((item, index) => {
        const editing = editingId === item.id;
        return (
          <FadeSlideIn key={item.id} delay={index * motion.staggerStepMs} fromY={8}>
            <HeroCard
              onPress={editing ? undefined : () => startEdit(item)}
              style={{ marginBottom: theme.spacing.sm, borderColor: editing ? '#5C7A94' : 'rgba(255,255,255,0.14)', borderWidth: editing ? 2 : 1.5 }}
              scaleOnPress={!editing}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <AppText variant="headingSmall" color="#FFFFFF">
                    {item.foodName}
                  </AppText>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                    {item.quantity}
                    {item.unit}
                    {editing ? '' : ' · tap to edit'}
                  </AppText>
                </View>
                <AppText variant="bodyMedium" color="#FFFFFF">
                  {Math.round(item.calories)} kcal
                </AppText>
              </View>
              {editing ? (
                <View style={{ marginTop: theme.spacing.sm }}>
                  <HeroTextField label={`Amount (${item.unit})`} value={quantityText} onChangeText={setQuantityText} keyboardType="decimal-pad" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm }}>
                    <Pressable onPress={() => removeItem(item)} disabled={busy} accessibilityRole="button" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AppIcon name="trash-outline" size={16} color="#F2A08F" />
                      <AppText variant="bodySmall" color="#F2A08F" style={{ marginLeft: 4 }}>
                        Remove
                      </AppText>
                    </Pressable>
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => setEditingId(null)} accessibilityRole="button" hitSlop={8} style={{ marginRight: theme.spacing.md }}>
                      <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
                        Cancel
                      </AppText>
                    </Pressable>
                    <Pressable onPress={() => saveQuantity(item)} disabled={busy || !(Number(quantityText.replace(',', '.')) > 0)} accessibilityRole="button" hitSlop={8}>
                      <AppText variant="bodyMedium" color="#FFFFFF">
                        Save
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </HeroCard>
          </FadeSlideIn>
        );
      })}

      <AppGradientButton label="Delete meal" onPress={deleteMeal} disabled={busy} colors={DANGER_GRADIENT} style={{ marginTop: theme.spacing.md }} />
    </TabHeroLayout>
  );
};
