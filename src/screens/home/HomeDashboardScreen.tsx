import React, { useCallback, useEffect, useState } from 'react';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useAppDispatch } from '@/store/hooks';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { TodaySummary } from '@/features/dashboard/components/TodaySummary';
import { FastingCard } from '@/features/dashboard/components/FastingCard';
import { NutritionCard } from '@/features/dashboard/components/NutritionCard';
import { CalorieBalanceCard } from '@/features/dashboard/components/CalorieBalanceCard';
import { ActivityCard } from '@/features/dashboard/components/ActivityCard';
import { WeightCard } from '@/features/dashboard/components/WeightCard';
import { MeditationCard } from '@/features/dashboard/components/MeditationCard';
import { GoalsCard } from '@/features/dashboard/components/GoalsCard';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';
import { loadActivityData } from '@/features/activity/activitySlice';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { loadWeightHistory } from '@/features/weight/weightSlice';
import { motion } from '@/theme/motion';

// Every section fades/slides in on its own beat when the tab mounts —
// index * staggerStepMs keeps the timing consistent with the stagger
// pattern used everywhere else this session (onboarding, auth) rather than
// picking new numbers here.
const SECTIONS = [DashboardHeader, TodaySummary, QuickActions, FastingCard, CalorieBalanceCard, NutritionCard, ActivityCard, MeditationCard, WeightCard, GoalsCard];

export const HomeDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {
    dispatch(loadFastingData());
    dispatch(loadTodayMeals());
    dispatch(loadActivityData());
    dispatch(loadMeditationData());
    dispatch(loadWeightHistory());
  }, [dispatch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadAll();
    setTimeout(() => setRefreshing(false), 400);
  }, [loadAll]);

  return (
    <TabHeroLayout refreshing={refreshing} onRefresh={onRefresh}>
      {SECTIONS.map((Section, index) => (
        <FadeSlideIn key={Section.displayName ?? index} delay={index * motion.staggerStepMs}>
          <Section />
        </FadeSlideIn>
      ))}
    </TabHeroLayout>
  );
};
