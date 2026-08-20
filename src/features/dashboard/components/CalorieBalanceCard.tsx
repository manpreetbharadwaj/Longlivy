import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectDailyEnergyBalance } from '@/features/calories/selectors';

export const CalorieBalanceCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const balance = useAppSelector(selectDailyEnergyBalance);
  const exceeded = balance.exceededBy > 0;

  return (
    <HeroCard style={{ marginBottom: theme.spacing.sm, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: theme.radius.sm,
              backgroundColor: 'rgba(224,162,78,0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.xs,
            }}
          >
            <AppIcon name="flame" size={15} color="#E0A24E" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF">
            Energy balance
          </AppText>
        </View>
        <AppBadge label={exceeded ? 'Goal exceeded' : 'On track'} tone={exceeded ? 'warning' : 'success'} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Stat index={0} label="Goal" value={balance.calorieGoal} />
        <Stat index={1} label="Consumed" value={Math.round(balance.caloriesConsumed)} />
        <Stat index={2} label="Expenditure" value={Math.round(balance.totalExpenditure)} />
        <Stat
          index={3}
          label={exceeded ? 'Exceeded by' : 'Remaining'}
          value={exceeded ? Math.round(balance.exceededBy) : Math.round(balance.remaining)}
          formatter={exceeded ? (n) => `+${Math.round(n)}` : undefined}
          color={exceeded ? '#E0A24E' : '#4FB77E'}
        />
      </View>
      <CardShimmer delay={450} />
    </HeroCard>
  );
});

CalorieBalanceCard.displayName = 'CalorieBalanceCard';

const Stat: React.FC<{ index: number; label: string; value: number; formatter?: (n: number) => string; color?: string }> = React.memo(
  ({ index, label, value, formatter, color }) => (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
      <View>
        <AnimatedNumberText value={value} formatter={formatter} variant="headingSmall" color={color ?? '#FFFFFF'} />
        <AppText variant="caption" color="rgba(255,255,255,0.6)">
          {label}
        </AppText>
      </View>
    </FadeSlideIn>
  )
);
Stat.displayName = 'Stat';
