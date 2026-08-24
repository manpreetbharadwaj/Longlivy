import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { selectDailyEnergyBalance } from '@/features/calories/selectors';
import { dashboardColors, dashboardCardStyle } from '../dashboardTheme';

export const CalorieBalanceCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const balance = useAppSelector(selectDailyEnergyBalance);
  const exceeded = balance.exceededBy > 0;
  const fraction = balance.calorieGoal > 0 ? balance.caloriesConsumed / balance.calorieGoal : 0;
  const animatedFraction = useAnimatedProgress(Math.min(fraction, 1));

  return (
    <HeroCard style={[dashboardCardStyle, { marginBottom: theme.spacing.sm, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
          Energy balance
        </AppText>
        <AppBadge label={exceeded ? 'Goal exceeded' : 'On track'} tone={exceeded ? 'warning' : 'success'} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: theme.spacing.xs }}>
        <AnimatedNumberText
          value={exceeded ? balance.exceededBy : balance.remaining}
          formatter={(n) => `${exceeded ? '+' : ''}${Math.round(n)}`}
          variant="metricLarge"
          color={exceeded ? dashboardColors.warning : dashboardColors.textPrimary}
        />
        <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginLeft: 6, marginBottom: 8 }}>
          {`kcal ${exceeded ? 'over' : 'remaining'}`}
        </AppText>
      </View>

      <AppProgressBar progress={animatedFraction} color={exceeded ? dashboardColors.warning : dashboardColors.accent} trackColor={dashboardColors.border} height={6} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md }}>
        <Stat index={0} label="Goal" value={balance.calorieGoal} />
        <Stat index={1} label="Consumed" value={Math.round(balance.caloriesConsumed)} />
        <Stat index={2} label="Burned" value={Math.round(balance.totalExpenditure)} />
      </View>
      <CardShimmer delay={450} />
    </HeroCard>
  );
});

CalorieBalanceCard.displayName = 'CalorieBalanceCard';

const Stat: React.FC<{ index: number; label: string; value: number }> = React.memo(({ index, label, value }) => (
  <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
    <View>
      <AnimatedNumberText value={value} variant="headingSmall" color={dashboardColors.textPrimary} />
      <AppText variant="caption" color={dashboardColors.textMuted}>
        {label}
      </AppText>
    </View>
  </FadeSlideIn>
));
Stat.displayName = 'Stat';
