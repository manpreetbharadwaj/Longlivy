import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { useTheme } from '@/hooks/useTheme';
import { dashboardColors, dashboardCardElevated } from '@/features/dashboard/dashboardTheme';

interface Metric {
  icon: AppIconName;
  value: number;
  formatter?: (n: number) => string;
  label: string;
}

/**
 * One unified metrics card rather than three separate tiles — reads as a
 * single deliberate "dashboard" component with dividers between metrics
 * instead of three unrelated boxes.
 */
export const ActivitySummaryCard: React.FC<{ activities: number; distanceKm: number; calories: number }> = React.memo(
  ({ activities, distanceKm, calories }) => {
    const { theme } = useTheme();
    const metrics: Metric[] = [
      { icon: 'walk-outline', value: activities, label: 'Activities' },
      { icon: 'navigate-outline', value: distanceKm, formatter: (n) => `${n.toFixed(1)} km`, label: 'Distance' },
      { icon: 'flame-outline', value: calories, formatter: (n) => `${Math.round(n)}`, label: 'Calories' },
    ];

    return (
      <HeroCard style={[dashboardCardElevated, { marginBottom: theme.spacing.md, overflow: 'hidden' }]}>
        <View style={{ flexDirection: 'row' }}>
          {metrics.map((m, i) => (
            <React.Fragment key={m.label}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: dashboardColors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: dashboardColors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: theme.spacing.xxs,
                  }}
                >
                  <AppIcon name={m.icon} size={17} color={dashboardColors.accent} />
                </View>
                <AnimatedNumberText value={m.value} formatter={m.formatter} variant="headingMedium" color={dashboardColors.textPrimary} />
                <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: 2 }}>
                  {m.label}
                </AppText>
              </View>
              {i < metrics.length - 1 ? <View style={{ width: 1, backgroundColor: dashboardColors.border, marginVertical: theme.spacing.xs }} /> : null}
            </React.Fragment>
          ))}
        </View>
        <CardShimmer delay={400} />
      </HeroCard>
    );
  }
);

ActivitySummaryCard.displayName = 'ActivitySummaryCard';
