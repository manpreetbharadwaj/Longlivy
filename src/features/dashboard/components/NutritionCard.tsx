import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectNutritionProgress } from '@/features/nutrition/selectors';

export const NutritionCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const progress = useAppSelector(selectNutritionProgress);

  return (
    <AppCard onPress={() => navigation.navigate('NutritionTab', { screen: 'NutritionDashboard' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall">Nutrition</AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary}>
          {Math.round(progress.calories.current)} / {progress.calories.target} kcal
        </AppText>
      </View>
      <MacroRow label="Protein" progress={progress.protein} color={theme.colors.nutrition} />
      <MacroRow label="Carbs" progress={progress.carbohydrates} color={theme.colors.info} />
      <MacroRow label="Fat" progress={progress.fat} color={theme.colors.secondary} />
    </AppCard>
  );
});

NutritionCard.displayName = 'NutritionCard';

const MacroRow: React.FC<{ label: string; progress: { current: number; target: number; percentage: number }; color: string }> = React.memo(
  ({ label, progress, color }) => {
    const { theme } = useTheme();
    return (
      <View style={{ marginBottom: theme.spacing.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {label}
          </AppText>
          <AppText variant="bodySmall">
            {Math.round(progress.current)}g / {progress.target}g
          </AppText>
        </View>
        <AppProgressBar progress={progress.percentage / 100} color={color} height={6} />
      </View>
    );
  }
);
MacroRow.displayName = 'MacroRow';
