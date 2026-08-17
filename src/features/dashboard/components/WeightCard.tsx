import React from 'react';
import { View } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentWeight, selectWeightTrend } from '@/features/weight/selectors';

export const WeightCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const current = useAppSelector(selectCurrentWeight);
  const trend = useAppSelector(selectWeightTrend);

  return (
    <AppCard style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIconTile name="scale-outline" color={theme.colors.weight} size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
          <View>
            <AppText variant="headingSmall">Weight</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {current ? `Logged ${new Date(current.timestamp).toLocaleDateString()}` : 'No entries yet'}
            </AppText>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="headingSmall">{current ? `${current.weightKg.toFixed(1)} kg` : '—'}</AppText>
          {current ? (
            <AppBadge label={current.source === 'manual' ? 'Manual' : current.source.replace('_', ' ')} tone={current.source === 'manual' ? 'neutral' : 'info'} />
          ) : null}
          {trend !== 0 ? (
            <AppText variant="caption" color={trend < 0 ? theme.colors.success : theme.colors.warning}>
              {trend > 0 ? '+' : ''}
              {trend} kg
            </AppText>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
});

WeightCard.displayName = 'WeightCard';
