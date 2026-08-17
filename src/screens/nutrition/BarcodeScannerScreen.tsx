import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppInput } from '@/components/common/AppInput';
import { AppCard } from '@/components/common/AppCard';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { DEMO_BARCODES } from '@/mock/foodDatabaseSeed';

/**
 * Scan barcode → recognize product → view product data → select quantity →
 * select meal → save, per the spec's flow. The camera scan and the manual
 * fallback both terminate in the same lookup, so an unrecognized barcode
 * always has a path to manual entry rather than a dead end.
 */
export const BarcodeScannerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'not_found'>('idle');
  const mealType = 'snack';

  const lookup = useCallback(
    async (barcode: string) => {
      setLookupStatus('loading');
      const food = await nutritionRepository.getFoodByBarcode(barcode);
      if (food) {
        setLookupStatus('idle');
        navigation.replace('AddFood', { foodId: food.id, mealType });
      } else {
        setLookupStatus('not_found');
      }
    },
    [navigation]
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

  const canUseCamera = Platform.OS !== 'web';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Scan barcode" onBack={() => navigation.goBack()} />

      {canUseCamera ? (
        <View style={styles.cameraWrap}>
          {!permission ? null : !permission.granted ? (
            <View style={styles.permissionBox}>
              <AppIcon name="camera-outline" size={32} color={theme.colors.textSecondary} />
              <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                Longlivy needs camera access to scan barcodes.
              </AppText>
              <AppButton label="Allow camera access" onPress={requestPermission} fullWidth={false} />
            </View>
          ) : (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'] }}
              onBarcodeScanned={scanned ? undefined : handleScanned}
            />
          )}
          <View style={styles.frame} pointerEvents="none" />
        </View>
      ) : null}

      <View style={{ padding: theme.spacing.md }}>
        {lookupStatus === 'loading' ? (
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginBottom: theme.spacing.sm }}>
            Looking up product…
          </AppText>
        ) : null}
        {lookupStatus === 'not_found' ? (
          <AppCard style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xxs }}>
              Barcode not recognized
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.sm }}>
              This product isn't in the food database yet. Add it manually and it'll be found next time.
            </AppText>
            <AppButton
              label="Add this product manually"
              variant="outline"
              onPress={() => navigation.navigate('MyFoods', { barcode: manualCode || undefined })}
            />
          </AppCard>
        ) : null}

        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          Or enter a barcode manually
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <View style={{ flex: 1, marginRight: theme.spacing.xs }}>
            <AppInput
              value={manualCode}
              onChangeText={(t) => {
                setManualCode(t);
                setScanned(false);
                setLookupStatus('idle');
              }}
              placeholder="e.g. 4029764001807"
              keyboardType="number-pad"
            />
          </View>
          <AppButton label="Look up" onPress={handleManualLookup} fullWidth={false} disabled={!manualCode.trim()} style={{ height: 52 }} />
        </View>
        {DEMO_BARCODES.length ? (
          <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.xs }}>
            Demo barcodes to try: {DEMO_BARCODES.map((b) => `${b.barcode} (${b.name})`).join(' · ')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraWrap: {
    height: 320,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
