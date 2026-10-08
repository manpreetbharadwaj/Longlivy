import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectNutritionGoals } from '@/features/nutrition/selectors';
import { loadNutritionTargetsThunk, nutritionTargetsEnabled, saveNutritionTargetThunk, setNutritionGoal, toggleNutritionGoal } from '@/features/nutrition/nutritionSlice';
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
  const targetsError = useAppSelector((state) => state.nutrition.targetsError);

  useEffect(() => {
    if (nutritionTargetsEnabled) dispatch(loadNutritionTargetsThunk());
  }, [dispatch]);

  const setTarget = useCallback((key: keyof NutritionGoals, value: string) => dispatch(setNutritionGoal({ key, target: Number(value) || 0 })), [dispatch]);
  // Saved once the field is committed, not on every keystroke.
  const commitTarget = useCallback(
    (key: keyof NutritionGoals) => {
      if (nutritionTargetsEnabled) dispatch(saveNutritionTargetThunk({ key, target: goals[key].target }));
    },
    [dispatch, goals],
  );
  const toggle = useCallback(
    (key: keyof NutritionGoals) => {
      const active = !goals[key].active;
      dispatch(toggleNutritionGoal(key));
      if (nutritionTargetsEnabled) dispatch(saveNutritionTargetThunk({ key, active }));
    },
    [dispatch, goals],
  );

  return (
    <TabHeroLayout title="Nutrition goals" onBack={() => navigation.goBack()}>
      {targetsError ? (
        <AppText variant="caption" color="#F2A08F" style={{ marginBottom: theme.spacing.sm }}>
          {targetsError}
        </AppText>
      ) : null}
      {ROWS.map((row, index) => (
        <FadeSlideIn key={row.key} delay={index * motion.staggerStepMs} fromY={8}>
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {row.label}
              </AppText>
              <AppSwitch value={goals[row.key].active} onValueChange={() => toggle(row.key)} variant="hero" />
            </View>
            <HeroTextField value={String(goals[row.key].target)} onChangeText={(v) => setTarget(row.key, v)} onEndEditing={() => commitTarget(row.key)} keyboardType="numeric" editable={goals[row.key].active} />
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.xxs }}>
              Target: {goals[row.key].target} {row.unit} · Source: {goals[row.key].source}
            </AppText>
          </HeroCard>
        </FadeSlideIn>
      ))}
    </TabHeroLayout>
  );
};
