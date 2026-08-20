import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
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
    <HeroCard style={{ marginBottom: theme.spacing.sm, overflow: 'hidden' }}>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
        Today
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <SummaryPill index={0} icon="restaurant-outline" value={Math.round(nutritionTotals.calories)} suffix=" kcal" />
        <SummaryPill index={1} icon="walk-outline" value={activityCalories} suffix=" kcal" />
        <SummaryPill index={2} icon="leaf-outline" value={Math.round(meditationSeconds / 60)} suffix=" min" />
        <SummaryPill index={3} icon="flame-outline" value={fastingStats.currentStreak} suffix="d streak" />
      </View>
      <CardShimmer delay={400} />
    </HeroCard>
  );
});

TodaySummary.displayName = 'TodaySummary';

const SummaryPill: React.FC<{ index: number; icon: AppIconName; value: number; suffix: string }> = React.memo(({ index, icon, value, suffix }) => {
  const { theme } = useTheme();
  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 6,
          marginRight: theme.spacing.xs,
          marginBottom: theme.spacing.xs,
        }}
      >
        <AppIcon name={icon} size={14} color="rgba(255,255,255,0.7)" />
        <AnimatedNumberText value={value} variant="bodySmall" color="#FFFFFF" formatter={(n) => `${Math.round(n)}${suffix}`} style={{ marginLeft: 4 }} />
      </View>
    </FadeSlideIn>
  );
});
SummaryPill.displayName = 'SummaryPill';
