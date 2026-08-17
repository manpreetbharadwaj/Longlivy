import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';

export const MyFoodsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const route = useRoute<RouteProp<NutritionStackParamList, 'MyFoods'>>();
  const barcode = route.params?.barcode;
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const valid = name.trim().length > 0 && calories.length > 0;

  const save = useCallback(async () => {
    setSaving(true);
    await nutritionRepository.createOwnFood({
      name,
      category: 'Custom',
      barcode,
      servingSize: 100,
      unit: 'g',
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbohydrates: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    setSaving(false);
    setSaved(true);
  }, [name, calories, protein, carbs, fat, barcode]);

  void DEMO_USER_ID;

  return (
    <>
      <AppHeader title="Create own food" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Values are per 100g. Your own foods stay private to your account.
        </AppText>
        {barcode ? (
          <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginBottom: theme.spacing.sm }}>
            Barcode {barcode} will be linked to this food, so scanning it again finds this entry.
          </AppText>
        ) : null}
        <AppInput label="Name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.sm }} />
        <AppInput label="Calories (per 100g)" value={calories} onChangeText={setCalories} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppInput label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />
          </View>
        </View>
        <AppButton
          label={saved ? 'Saved' : 'Save food'}
          icon={saved ? <AppIcon name="checkmark-circle" size={18} color={theme.colors.onPrimary} /> : undefined}
          onPress={save}
          disabled={!valid}
          loading={saving}
        />
      </AppScreen>
    </>
  );
};
