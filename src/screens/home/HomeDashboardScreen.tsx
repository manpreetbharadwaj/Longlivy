import React, { useCallback, useEffect, useState } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { StaggerGroup } from '@/components/common/StaggerGroup';
import { sectionEnvironments } from '@/theme/environments';
import { useAppDispatch } from '@/store/hooks';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DailyPulseCard } from '@/features/dashboard/components/DailyPulseCard';
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

// The remaining sections stagger in together (index * staggerStepMs, capped)
// via StaggerGroup — DashboardHeader is excluded since it drives its own
// scroll-collapse animation instead of a mount-in entrance.
const SECTIONS = [DailyPulseCard, TodaySummary, QuickActions, FastingCard, CalorieBalanceCard, NutritionCard, ActivityCard, MeditationCard, WeightCard, GoalsCard];

export const HomeDashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  useScrollToTop(scrollRef);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

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
    <SectionHeroLayout
      environment={sectionEnvironments.home}
      scrollRef={scrollRef}
      onScroll={onScroll}
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={<DashboardHeader scrollY={scrollY} />}
    >
      <StaggerGroup>
        {SECTIONS.map((Section, index) => (
          <Section key={Section.displayName ?? index} />
        ))}
      </StaggerGroup>
    </SectionHeroLayout>
  );
};
