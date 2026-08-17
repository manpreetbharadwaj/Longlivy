import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNutritionGoals } from '@/features/nutrition/selectors';
import { setNutritionGoal, toggleNutritionGoal } from '@/features/nutrition/nutritionSlice';
import { NutritionGoals } from '@/features/nutrition/models';

const ROWS: { key: keyof NutritionGoals; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
];

export const NutritionGoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectNutritionGoals);

  const setTarget = useCallback((key: keyof NutritionGoals, value: string) => dispatch(setNutritionGoal({ key, target: Number(value) || 0 })), [dispatch]);

  return (
    <>
      <AppHeader title="Nutrition goals" onBack={() => navigation.goBack()} />
      <AppScreen>
        {ROWS.map((row) => (
          <AppCard key={row.key} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <AppText variant="headingSmall">{row.label}</AppText>
              <AppSwitch value={goals[row.key].active} onValueChange={() => dispatch(toggleNutritionGoal(row.key))} />
            </View>
            <AppInput value={String(goals[row.key].target)} onChangeText={(v) => setTarget(row.key, v)} keyboardType="numeric" editable={goals[row.key].active} />
            <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.xxs }}>
              Target: {goals[row.key].target} {row.unit} · Source: {goals[row.key].source}
            </AppText>
          </AppCard>
        ))}
      </AppScreen>
    </>
  );
};
