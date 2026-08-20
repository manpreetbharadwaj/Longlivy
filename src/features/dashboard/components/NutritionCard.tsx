import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { selectNutritionProgress } from '@/features/nutrition/selectors';

export const NutritionCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const progress = useAppSelector(selectNutritionProgress);

  return (
    <HeroCard onPress={() => navigation.navigate('NutritionTab', { screen: 'NutritionDashboard' })} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF">
          Nutrition
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          <AnimatedNumberText value={Math.round(progress.calories.current)} variant="bodySmall" color="rgba(255,255,255,0.6)" />
          {` / ${progress.calories.target} kcal`}
        </AppText>
      </View>
      <MacroRow index={0} label="Protein" progress={progress.protein} color="#E7A868" />
      <MacroRow index={1} label="Carbs" progress={progress.carbohydrates} color="#6AA3DE" />
      <MacroRow index={2} label="Fat" progress={progress.fat} color="#B98CE0" />
    </HeroCard>
  );
});

NutritionCard.displayName = 'NutritionCard';

const MacroRow: React.FC<{ index: number; label: string; progress: { current: number; target: number; percentage: number }; color: string }> = React.memo(
  ({ index, label, progress, color }) => {
    const animatedFraction = useAnimatedProgress(progress.percentage / 100);
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {label}
            </AppText>
            <AppText variant="bodySmall" color="#FFFFFF">
              <AnimatedNumberText value={Math.round(progress.current)} variant="bodySmall" color="#FFFFFF" />
              {`g / ${progress.target}g`}
            </AppText>
          </View>
          <AppProgressBar progress={animatedFraction} color={color} trackColor="rgba(255,255,255,0.12)" height={6} />
        </View>
      </FadeSlideIn>
    );
  }
);
MacroRow.displayName = 'MacroRow';
