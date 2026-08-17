import React from 'react';
import { View } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectTodayMeditationSeconds } from '@/features/meditation/selectors';
import { selectTodayActivityCalories } from '@/features/activity/selectors';
import { selectDailyNutritionTotals } from '@/features/nutrition/selectors';
import { selectFastingStats } from '@/features/fasting/selectors';

export const TodaySummary: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const meditationSeconds = useAppSelector(selectTodayMeditationSeconds);
  const activityCalories = useAppSelector(selectTodayActivityCalories);
  const nutritionTotals = useAppSelector(selectDailyNutritionTotals);
  const fastingStats = useAppSelector(selectFastingStats);

  return (
    <AppCard style={{ marginBottom: theme.spacing.sm }}>
      <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.sm }}>
        Today
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <SummaryPill icon="restaurant-outline" label={`${Math.round(nutritionTotals.calories)} kcal`} />
        <SummaryPill icon="walk-outline" label={`${activityCalories} kcal`} />
        <SummaryPill icon="leaf-outline" label={`${Math.round(meditationSeconds / 60)} min`} />
        <SummaryPill icon="flame-outline" label={`${fastingStats.currentStreak}d streak`} />
      </View>
    </AppCard>
  );
});

TodaySummary.displayName = 'TodaySummary';

const SummaryPill: React.FC<{ icon: AppIconName; label: string }> = React.memo(({ icon, label }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 6,
        marginRight: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
      }}
    >
      <AppIcon name={icon} size={14} color={theme.colors.textSecondary} />
      <AppText variant="bodySmall" style={{ marginLeft: 4 }}>
        {label}
      </AppText>
    </View>
  );
});
SummaryPill.displayName = 'SummaryPill';
