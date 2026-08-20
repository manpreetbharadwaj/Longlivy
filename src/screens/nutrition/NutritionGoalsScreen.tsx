import React, { useCallback } from 'react';
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
    <TabHeroLayout title="Nutrition goals" onBack={() => navigation.goBack()}>
      {ROWS.map((row, index) => (
        <FadeSlideIn key={row.key} delay={index * motion.staggerStepMs} fromY={8}>
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {row.label}
              </AppText>
              <AppSwitch value={goals[row.key].active} onValueChange={() => dispatch(toggleNutritionGoal(row.key))} variant="hero" />
            </View>
            <HeroTextField value={String(goals[row.key].target)} onChangeText={(v) => setTarget(row.key, v)} keyboardType="numeric" editable={goals[row.key].active} />
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.xxs }}>
              Target: {goals[row.key].target} {row.unit} · Source: {goals[row.key].source}
            </AppText>
          </HeroCard>
        </FadeSlideIn>
      ))}
    </TabHeroLayout>
  );
};
