import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';

interface AppTrendBadgeProps {
  /** Percentage change vs. the previous period, or null when not computable (e.g. previous period had no data). */
  percent: number | null;
  /** When false (e.g. "calories over goal"), a rise is shown in the warning color instead of success. */
  higherIsBetter?: boolean;
}

/**
 * "vs previous period" indicator — an arrow + percentage, never claiming
 * precision the underlying data doesn't have (renders "No prior data"
 * instead of a fabricated 0% when there's nothing to compare against).
 */
export const AppTrendBadge: React.FC<AppTrendBadgeProps> = React.memo(({ percent, higherIsBetter = true }) => {
  const { theme } = useTheme();

  if (percent === null) {
    return (
      <AppText variant="caption" color={theme.colors.textTertiary}>
        No prior period data
      </AppText>
    );
  }

  const isFlat = percent === 0;
  const isUp = percent > 0;
  const good = isFlat ? null : isUp === higherIsBetter;
  const color = isFlat ? theme.colors.textSecondary : good ? theme.colors.success : theme.colors.warning;
  const iconName = isFlat ? 'remove-outline' : isUp ? 'trending-up' : 'trending-down';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <AppIcon name={iconName} size={14} color={color} />
      <AppText variant="caption" color={color} style={{ marginLeft: 3 }}>
        {isFlat ? 'No change' : `${isUp ? '+' : ''}${percent}%`} vs previous
      </AppText>
    </View>
  );
});

AppTrendBadge.displayName = 'AppTrendBadge';
