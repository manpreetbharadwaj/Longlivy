import React from 'react';
import { View } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectDailyEnergyBalance } from '@/features/calories/selectors';

export const CalorieBalanceCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const balance = useAppSelector(selectDailyEnergyBalance);
  const exceeded = balance.exceededBy > 0;

  return (
    <AppCard style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall">Energy balance</AppText>
        <AppBadge label={exceeded ? 'Goal exceeded' : 'On track'} tone={exceeded ? 'warning' : 'success'} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Stat label="Goal" value={`${balance.calorieGoal}`} />
        <Stat label="Consumed" value={`${Math.round(balance.caloriesConsumed)}`} />
        <Stat label="Expenditure" value={`${Math.round(balance.totalExpenditure)}`} />
        <Stat
          label={exceeded ? 'Exceeded by' : 'Remaining'}
          value={exceeded ? `+${Math.round(balance.exceededBy)}` : `${Math.round(balance.remaining)}`}
          color={exceeded ? theme.colors.warning : theme.colors.success}
        />
      </View>
    </AppCard>
  );
});

CalorieBalanceCard.displayName = 'CalorieBalanceCard';

const Stat: React.FC<{ label: string; value: string; color?: string }> = React.memo(({ label, value, color }) => {
  const { theme } = useTheme();
  return (
    <View>
      <AppText variant="headingSmall" color={color}>
        {value}
      </AppText>
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
});
Stat.displayName = 'Stat';
