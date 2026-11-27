import React, { useCallback, useRef, useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroChip } from '@/components/common/HeroChip';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { MealType } from '@/features/nutrition/models';
import { ScanSessionItem, updateScanSessionItem, removeScanSessionItem, saveScanSessionThunk } from '@/features/nutrition/nutritionSlice';
import { selectScanSession, selectScanSessionTotals } from '@/features/nutrition/selectors';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';

const NUTRITION_GRADIENT = ['#C9974E', '#8F6A2E'] as const;
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * The consolidated checkpoint for a multi-barcode scanning session — nothing
 * scanned reaches the food diary until "Save All Items" here. Items and
 * their save status live in Redux (`nutrition.scanSession`), not route
 * params, so "Scan additional products" is a plain `goBack()` back to the
 * still-mounted scanner rather than a round trip that could lose state.
 */
export const BarcodeScanReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectScanSession);
  const totals = useAppSelector(selectScanSessionTotals);
  // One save in flight at a time: a double tap on "Save All Items" must not send two batches.
  const savingRef = useRef(false);

  const handleSave = useCallback(async () => {
    if (savingRef.current || session.items.length === 0) return;
    savingRef.current = true;
    const result = await dispatch(saveScanSessionThunk());
    savingRef.current = false;
    if (saveScanSessionThunk.fulfilled.match(result) && result.payload.failedIds.length === 0) {
      navigation.popToTop();
    }
  }, [dispatch, session.items.length, navigation]);

  if (session.items.length === 0) {
    return (
      <TabHeroLayout title={t('nutrition.scanReview.title')} onBack={() => navigation.goBack()}>
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
            <AppIcon name="barcode-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {t('nutrition.scanReview.emptyTitle')}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
            {t('nutrition.scanReview.emptyMessage')}
          </AppText>
          <AppGradientButton label={t('nutrition.scanReview.scanAdditional')} onPress={() => navigation.goBack()} colors={NUTRITION_GRADIENT} fullWidth={false} />
        </View>
      </TabHeroLayout>
    );
  }

  return (
    <TabHeroLayout title={t('nutrition.scanReview.title')} onBack={() => navigation.goBack()}>
      {session.error ? (
        <HeroCard style={{ marginBottom: theme.spacing.md, borderColor: '#DD7A68' }}>
          <AppText variant="bodyMedium" color="#F2A08F">
            {session.error}
          </AppText>
        </HeroCard>
      ) : null}

      {session.items.map((item, index) => (
        <ScanReviewRow key={item.id} index={index} item={item} />
      ))}

      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={{ alignSelf: 'center', marginBottom: theme.spacing.lg }}>
        <AppText variant="bodyMedium" color="#9C7A3E">
          + {t('nutrition.scanReview.scanAdditional')}
        </AppText>
      </Pressable>

      <HeroCard style={{ marginBottom: theme.spacing.lg }}>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.xxs }}>
          {t('nutrition.scanReview.totalsLabel')}
        </AppText>
        <AnimatedNumberText value={Math.round(totals.calories)} variant="metricMedium" color="#FFFFFF" formatter={(n) => `${Math.round(n)} kcal`} />
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          P {Math.round(totals.protein)}g · C {Math.round(totals.carbohydrates)}g · F {Math.round(totals.fat)}g
        </AppText>
      </HeroCard>

      <AppGradientButton label={t('nutrition.scanReview.saveAll')} onPress={handleSave} loading={session.saving} disabled={session.items.length === 0} colors={NUTRITION_GRADIENT} />
    </TabHeroLayout>
  );
};

const ScanReviewRow: React.FC<{ index: number; item: ScanSessionItem }> = React.memo(({ index, item }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [quantityText, setQuantityText] = useState(String(item.quantity));
  const scaled = scaleNutrition(item.food, Number(quantityText) || 0);

  const commitQuantity = useCallback(
    (text: string) => {
      setQuantityText(text);
      const quantity = Number(text.replace(',', '.'));
      if (quantity > 0) dispatch(updateScanSessionItem({ id: item.id, quantity }));
    },
    [dispatch, item.id]
  );

  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
      <HeroCard style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
          {item.food.imageUrl ? (
            <Image source={{ uri: item.food.imageUrl }} style={{ width: 48, height: 48, borderRadius: theme.radius.md, marginRight: theme.spacing.sm }} />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.radius.md,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.sm,
              }}
            >
              <AppIcon name="nutrition-outline" size={22} color="rgba(255,255,255,0.5)" />
            </View>
          )}
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF">
              {item.food.name}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {item.food.brand ? `${item.food.brand} · ` : ''}
              {Math.round(scaled.calories)} kcal
            </AppText>
          </View>
          <Pressable onPress={() => dispatch(removeScanSessionItem(item.id))} accessibilityRole="button" hitSlop={8}>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
              {t('nutrition.scanReview.remove')}
            </AppText>
          </Pressable>
        </View>

        <HeroTextField
          label={t('nutrition.addFood.quantityLabel', { unit: item.food.unit })}
          value={quantityText}
          onChangeText={commitQuantity}
          keyboardType="numeric"
          style={{ marginBottom: theme.spacing.sm }}
        />

        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.xxs }}>
          {t('nutrition.scanReview.mealTypeLabel')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.xs }}>
          {MEAL_TYPES.map((mt) => (
            <HeroChip key={mt} label={t(`enums.meal.${mt}`)} selected={item.mealType === mt} onPress={() => dispatch(updateScanSessionItem({ id: item.id, mealType: mt }))} />
          ))}
        </View>
      </HeroCard>
    </FadeSlideIn>
  );
});
ScanReviewRow.displayName = 'ScanReviewRow';
