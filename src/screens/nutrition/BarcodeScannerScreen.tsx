import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Pressable, StatusBar, Alert, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroChip } from '@/components/common/HeroChip';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Food, MealType } from '@/features/nutrition/models';
import { scaleNutrition } from '@/features/nutrition/services/NutritionCalculationService';
import { addScanSessionItem, setScanSessionMealType, clearScanSession } from '@/features/nutrition/nutritionSlice';
import { selectScanSession } from '@/features/nutrition/selectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { DEMO_BARCODES } from '@/mock/foodDatabaseSeed';
import { env } from '@/config/env';
import { heroGradient } from '@/theme/gradients';

const NUTRITION_GRADIENT = ['#C9974E', '#8F6A2E'] as const;
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type Phase = 'idle' | 'loading' | 'not_found' | 'confirm' | 'added';

/**
 * Scan barcode -> recognize product -> confirm quantity/meal -> add to the
 * session -> scan another or review & finish. Nothing reaches the food
 * diary until the session is submitted from BarcodeScanReviewScreen; the
 * camera and manual-entry paths both feed the same `lookup`, and an
 * unrecognized barcode always has a path to manual entry rather than a dead
 * end. The session itself lives in Redux (`nutrition.scanSession`), not
 * component state, so it survives this screen losing focus (e.g. the Review
 * screen pushed on top, or a tab switch) without extra plumbing.
 */
export const BarcodeScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectScanSession);
  const tabBarSpacing = useFloatingTabBarSpacing();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [pendingFood, setPendingFood] = useState<Food | null>(null);
  const [quantityText, setQuantityText] = useState('');
  const [itemMealType, setItemMealType] = useState<MealType>(session.commonMealType);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  // Leaving with unsaved items would silently discard them — the user confirms the loss explicitly instead.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (session.items.length === 0) return;
      e.preventDefault();
      Alert.alert(
        t('nutrition.barcodeScan.exitTitle'),
        t('nutrition.barcodeScan.exitMessage', { count: session.items.length }),
        [
          { text: t('nutrition.barcodeScan.exitKeepScanning'), style: 'cancel' },
          {
            text: t('nutrition.barcodeScan.exitDiscard'),
            style: 'destructive',
            onPress: () => {
              dispatch(clearScanSession());
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, session.items.length, dispatch, t]);

  const beginConfirm = useCallback(
    (food: Food, mergeInto?: string) => {
      setPendingFood(food);
      setQuantityText(String(food.servingSize));
      setItemMealType(session.commonMealType);
      setMergeTargetId(mergeInto ?? null);
      setPhase('confirm');
    },
    [session.commonMealType]
  );

  const lookup = useCallback(
    async (barcode: string) => {
      setPhase('loading');
      const food = await nutritionRepository.getFoodByBarcode(barcode);
      if (!food) {
        setPhase('not_found');
        return;
      }
      const duplicate = food.barcode ? session.items.find((i) => i.food.barcode === food.barcode) : undefined;
      if (duplicate) {
        Alert.alert(
          t('nutrition.barcodeScan.duplicateTitle'),
          t('nutrition.barcodeScan.duplicateMessage', { name: food.name }),
          [
            { text: t('nutrition.barcodeScan.duplicateIncrease'), onPress: () => beginConfirm(food, duplicate.id) },
            { text: t('nutrition.barcodeScan.duplicateSeparate'), onPress: () => beginConfirm(food) },
            { text: t('common.cancel'), style: 'cancel', onPress: () => { setScanned(false); setPhase('idle'); } },
          ]
        );
        return;
      }
      beginConfirm(food);
    },
    [session.items, beginConfirm, t]
  );

  const handleScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);
      lookup(result.data);
    },
    [scanned, lookup]
  );

  const handleManualLookup = useCallback(() => {
    if (!manualCode.trim()) return;
    lookup(manualCode.trim());
  }, [manualCode, lookup]);

  const scaled = pendingFood ? scaleNutrition(pendingFood, Number(quantityText) || 0) : null;

  const handleAddToSession = useCallback(() => {
    if (!pendingFood) return;
    const quantity = Number(quantityText) || pendingFood.servingSize;
    dispatch(addScanSessionItem({ food: pendingFood, quantity, mealType: itemMealType, mergeIntoId: mergeTargetId ?? undefined }));
    setPendingFood(null);
    setMergeTargetId(null);
    setPhase('added');
  }, [dispatch, pendingFood, quantityText, itemMealType, mergeTargetId]);

  const handleScanAnother = useCallback(() => {
    setScanned(false);
    setManualCode('');
    setPhase('idle');
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setPendingFood(null);
    setMergeTargetId(null);
    setScanned(false);
    setPhase('idle');
  }, []);

  const canUseCamera = Platform.OS !== 'web';
  const cameraActive = phase === 'idle' || phase === 'loading' || phase === 'not_found';

  return (
    <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} style={{ width: 32 }}>
            <AppIcon name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <AppText variant="headingMedium" color="#FFFFFF" align="center" style={{ flex: 1 }}>
            {t('nutrition.barcodeScan.title')}
          </AppText>
          <View style={{ minWidth: 32, alignItems: 'flex-end' }}>
            {session.items.length > 0 ? <AppBadge label={t('nutrition.barcodeScan.itemsAdded', { count: session.items.length })} tone="primary" /> : null}
          </View>
        </View>

        {canUseCamera && cameraActive ? (
          // Fixed-height, clipped preview only while the camera is actually showing
          // (`permission.granted`) — the permission prompt below needs to size itself
          // to its own content instead, or a longer message/larger system font wraps
          // to more lines than the old fixed 320px ever accounted for and gets cut off
          // by this same box's `overflow: hidden`.
          <View style={permission?.granted ? styles.cameraWrap : styles.cameraWrapUnsized}>
            {!permission ? null : !permission.granted ? (
              <View style={styles.permissionBox}>
                <AppIcon name="camera-outline" size={32} color="rgba(255,255,255,0.6)" />
                <AppText
                  variant="bodyMedium"
                  color="rgba(255,255,255,0.6)"
                  align="center"
                  style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm, paddingHorizontal: theme.spacing.md }}
                >
                  {t('nutrition.barcodeScan.cameraPermission')}
                </AppText>
                <AppGradientButton label={t('nutrition.barcodeScan.allowCamera')} onPress={requestPermission} colors={NUTRITION_GRADIENT} style={{ alignSelf: 'center' }} fullWidth={false} />
              </View>
            ) : (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'] }}
                  onBarcodeScanned={scanned ? undefined : handleScanned}
                />
                <View style={styles.frame} pointerEvents="none" />
              </>
            )}
          </View>
        ) : null}

        <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.md + tabBarSpacing }} keyboardShouldPersistTaps="handled">
          {phase === 'idle' || phase === 'loading' || phase === 'not_found' ? (
            <>
              <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
                {t('nutrition.barcodeScan.mealLabel')}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
                {MEAL_TYPES.map((mt) => (
                  <HeroChip key={mt} label={t(`enums.meal.${mt}`)} selected={session.commonMealType === mt} onPress={() => dispatch(setScanSessionMealType(mt))} />
                ))}
              </View>

              {phase === 'loading' ? (
                <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginBottom: theme.spacing.sm }}>
                  {t('nutrition.barcodeScan.lookingUp')}
                </AppText>
              ) : null}
              {phase === 'not_found' ? (
                <HeroCard style={{ marginBottom: theme.spacing.md }}>
                  <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xxs }}>
                    {t('nutrition.barcodeScan.notFoundTitle')}
                  </AppText>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.sm }}>
                    {t('nutrition.barcodeScan.notFoundMessage')}
                  </AppText>
                  <Pressable onPress={() => navigation.navigate('MyFoods', { barcode: manualCode || undefined })} accessibilityRole="button">
                    <AppText variant="bodyMedium" color="#9C7A3E">
                      {t('nutrition.barcodeScan.addManually')}
                    </AppText>
                  </Pressable>
                </HeroCard>
              ) : null}

              <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
                {t('nutrition.barcodeScan.manualPrompt')}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
                  <HeroTextField
                    value={manualCode}
                    onChangeText={(text) => {
                      setManualCode(text);
                      setScanned(false);
                      setPhase('idle');
                    }}
                    placeholder={t('nutrition.barcodeScan.manualPlaceholder')}
                    keyboardType="number-pad"
                  />
                </View>
                <AppGradientButton label={t('nutrition.barcodeScan.lookupButton')} onPress={handleManualLookup} disabled={!manualCode.trim()} colors={NUTRITION_GRADIENT} fullWidth={false} />
              </View>
              {env.useMockApi && DEMO_BARCODES.length ? (
                <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.xs }}>
                  {t('nutrition.barcodeScan.demoBarcodes', { list: DEMO_BARCODES.map((b) => `${b.barcode} (${b.name})`).join(' · ') })}
                </AppText>
              ) : null}

              {session.items.length > 0 ? (
                <AppGradientButton
                  label={t('nutrition.barcodeScan.reviewFinish')}
                  onPress={() => navigation.navigate('BarcodeScanReview')}
                  colors={NUTRITION_GRADIENT}
                  style={{ marginTop: theme.spacing.lg }}
                />
              ) : null}
            </>
          ) : null}

          {phase === 'confirm' && pendingFood ? (
            <HeroCard>
              <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
                {pendingFood.imageUrl ? (
                  <Image source={{ uri: pendingFood.imageUrl }} style={{ width: 56, height: 56, borderRadius: theme.radius.md, marginRight: theme.spacing.sm }} />
                ) : (
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: theme.radius.md,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}
                  >
                    <AppIcon name="nutrition-outline" size={26} color="rgba(255,255,255,0.5)" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="headingSmall" color="#FFFFFF">
                    {pendingFood.name}
                  </AppText>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                    {pendingFood.brand ? `${pendingFood.brand} · ` : ''}
                    {pendingFood.category}
                  </AppText>
                </View>
              </View>

              <HeroTextField
                label={t('nutrition.addFood.quantityLabel', { unit: pendingFood.unit })}
                value={quantityText}
                onChangeText={setQuantityText}
                keyboardType="numeric"
                style={{ marginBottom: theme.spacing.sm }}
              />

              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.xxs }}>
                {t('nutrition.barcodeScan.mealLabel')}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                {MEAL_TYPES.map((mt) => (
                  <HeroChip key={mt} label={t(`enums.meal.${mt}`)} selected={itemMealType === mt} onPress={() => setItemMealType(mt)} />
                ))}
              </View>

              {scaled ? (
                <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.sm }}>
                  {Math.round(scaled.calories)} kcal · P {Math.round(scaled.protein)}g · C {Math.round(scaled.carbohydrates)}g · F {Math.round(scaled.fat)}g
                </AppText>
              ) : null}

              <AppGradientButton label={t('nutrition.barcodeScan.addToSession')} onPress={handleAddToSession} colors={NUTRITION_GRADIENT} style={{ marginBottom: theme.spacing.sm }} />
              <Pressable onPress={handleCancelConfirm} accessibilityRole="button" style={{ alignSelf: 'center' }}>
                <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
                  {t('common.cancel')}
                </AppText>
              </Pressable>
            </HeroCard>
          ) : null}

          {phase === 'added' ? (
            <HeroCard style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
              <AppIcon name="checkmark-circle" size={36} color="#7FC79E" />
              <AppText variant="headingSmall" color="#FFFFFF" align="center" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxs }}>
                {t('nutrition.barcodeScan.addedTitle')}
              </AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginBottom: theme.spacing.lg }}>
                {t('nutrition.barcodeScan.addedSubtitle', { count: session.items.length })}
              </AppText>
              <AppGradientButton label={t('nutrition.barcodeScan.scanAnother')} onPress={handleScanAnother} colors={NUTRITION_GRADIENT} style={{ marginBottom: theme.spacing.sm }} />
              <AppGradientButton label={t('nutrition.barcodeScan.reviewFinish')} onPress={() => navigation.navigate('BarcodeScanReview')} colors={['#4F8F6E', '#2F6B4C']} />
            </HeroCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraWrap: {
    height: 320,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  /** Same box, minus the fixed height/clip — used while showing the permission
   * prompt, whose content (icon + wrapped message + button) may be taller than
   * the camera preview's fixed 320px, especially at larger system font sizes. */
  cameraWrapUnsized: {
    backgroundColor: '#000',
  },
  permissionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  frame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '25%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
});
