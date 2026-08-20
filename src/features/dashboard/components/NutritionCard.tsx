import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
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
    <HeroCard onPress={() => navigation.navigate('NutritionTab', { screen: 'NutritionDashboard' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF">
          Nutrition
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          {Math.round(progress.calories.current)} / {progress.calories.target} kcal
        </AppText>
      </View>
      <MacroRow label="Protein" progress={progress.protein} color="#E7A868" />
      <MacroRow label="Carbs" progress={progress.carbohydrates} color="#6AA3DE" />
      <MacroRow label="Fat" progress={progress.fat} color="#B98CE0" />
    </HeroCard>
  );
});

NutritionCard.displayName = 'NutritionCard';

const MacroRow: React.FC<{ label: string; progress: { current: number; target: number; percentage: number }; color: string }> = React.memo(
  ({ label, progress, color }) => (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          {label}
        </AppText>
        <AppText variant="bodySmall" color="#FFFFFF">
          {Math.round(progress.current)}g / {progress.target}g
        </AppText>
      </View>
      <AppProgressBar progress={progress.percentage / 100} color={color} trackColor="rgba(255,255,255,0.12)" height={6} />
    </View>
  )
);
MacroRow.displayName = 'MacroRow';
