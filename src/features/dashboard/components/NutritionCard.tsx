import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { selectNutritionProgress } from '@/features/nutrition/selectors';
import { dashboardColors, dashboardCardStyle } from '../dashboardTheme';

export const NutritionCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const progress = useAppSelector(selectNutritionProgress);

  return (
    <HeroCard
      onPress={() => navigation.navigate('NutritionTab', { screen: 'NutritionDashboard' })}
      style={[dashboardCardStyle, { marginBottom: theme.spacing.sm }]}
      scaleOnPress
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
          Nutrition summary
        </AppText>
        <AppText variant="bodySmall" color={dashboardColors.accent}>
          View details
        </AppText>
      </View>
      <MacroRow index={0} label="Protein" icon="egg-outline" progress={progress.protein} color="#E0AC55" />
      <MacroRow index={1} label="Carbs" icon="pizza-outline" progress={progress.carbohydrates} color="#5B9BD5" />
      <MacroRow index={2} label="Fat" icon="water-outline" progress={progress.fat} color="#A78BC9" isLast />
    </HeroCard>
  );
});

NutritionCard.displayName = 'NutritionCard';

const MacroRow: React.FC<{
  index: number;
  label: string;
  icon: AppIconName;
  progress: { current: number; target: number; percentage: number };
  color: string;
  isLast?: boolean;
}> = React.memo(({ index, label, icon, progress, color, isLast }) => {
  const animatedFraction = useAnimatedProgress(progress.percentage / 100);
  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isLast ? 0 : 12 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <AppIcon name={icon} size={13} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <AppText variant="bodySmall" color={dashboardColors.textSecondary}>
              {label}
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textPrimary}>
              <AnimatedNumberText value={Math.round(progress.current)} variant="bodySmall" color={dashboardColors.textPrimary} />
              {`g / ${progress.target}g`}
            </AppText>
          </View>
          <AppProgressBar progress={animatedFraction} color={color} trackColor={dashboardColors.border} height={6} />
        </View>
        <View style={{ marginLeft: 6 }}>
          <AppIcon name="chevron-forward" size={14} color={dashboardColors.textMuted} />
        </View>
      </View>
    </FadeSlideIn>
  );
});
MacroRow.displayName = 'MacroRow';
