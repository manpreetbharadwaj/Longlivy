import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { selectTodayMeditationSeconds } from '@/features/meditation/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectFastingStats } from '@/features/fasting/selectors';
import { selectDailyEnergyBalance } from '@/features/calories/selectors';
import { dashboardColors, dashboardCardStyle } from '../dashboardTheme';

export const TodaySummary: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const meditationSeconds = useAppSelector(selectTodayMeditationSeconds);
  const activityCalories = useAppSelector(selectTodayActivityCalories);
  const nutritionTotals = useAppSelector(selectDailyNutritionTotals);
  const fastingStats = useAppSelector(selectFastingStats);
  const balance = useAppSelector(selectDailyEnergyBalance);

  const consumed = Math.round(nutritionTotals.calories);
  const goalFraction = balance.calorieGoal > 0 ? balance.caloriesConsumed / balance.calorieGoal : 0;
  const animatedFraction = useAnimatedProgress(Math.min(goalFraction, 1));

  return (
    <HeroCard style={[dashboardCardStyle, { marginBottom: theme.spacing.sm, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: dashboardColors.accent, marginRight: 6 }} />
            <AppText variant="label" color={dashboardColors.textSecondary}>
              Today
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <AnimatedNumberText value={consumed} variant="metricLarge" color={dashboardColors.textPrimary} />
            <AppText variant="headingSmall" color={dashboardColors.textSecondary} style={{ marginLeft: 6, marginBottom: 6 }}>
              kcal
            </AppText>
          </View>
          <AppText variant="bodySmall" color={dashboardColors.textMuted}>
            Consumed today
          </AppText>
        </View>
        <AppProgressRing progress={animatedFraction} size={64} strokeWidth={6} color={dashboardColors.accent} trackColor={dashboardColors.border} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: dashboardColors.border,
        }}
      >
        <MetricColumn index={0} icon="flame-outline" value={activityCalories} suffix=" kcal" label="Activity" />
        <MetricColumn index={1} icon="leaf-outline" value={Math.round(meditationSeconds / 60)} suffix=" min" label="Meditation" divider />
        <MetricColumn index={2} icon="ribbon-outline" value={fastingStats.currentStreak} suffix="d" label="Streak" divider />
        <MetricColumn index={3} icon="restaurant-outline" value={consumed} suffix="" label="Net kcal" divider />
      </View>
      <CardShimmer delay={400} />
    </HeroCard>
  );
});

TodaySummary.displayName = 'TodaySummary';

const MetricColumn: React.FC<{ index: number; icon: AppIconName; value: number; suffix: string; label: string; divider?: boolean }> = React.memo(
  ({ index, icon, value, suffix, label, divider }) => (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8} style={{ flex: 1 }}>
      <View
        style={{
          alignItems: 'center',
          borderLeftWidth: divider ? 1 : 0,
          borderLeftColor: dashboardColors.border,
        }}
      >
        <AppIcon name={icon} size={15} color={dashboardColors.textMuted} />
        <AnimatedNumberText
          value={value}
          variant="bodyMedium"
          weight="700"
          color={dashboardColors.textPrimary}
          formatter={(n) => `${Math.round(n)}${suffix}`}
          style={{ marginTop: 4 }}
        />
        <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: 1 }}>
          {label}
        </AppText>
      </View>
    </FadeSlideIn>
  )
);
MetricColumn.displayName = 'MetricColumn';
