import React, { useCallback, useEffect, useState } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { StaggerGroup } from '@/components/common/StaggerGroup';
import { sectionEnvironments } from '@/theme/environments';
import { useAppDispatch } from '@/store/hooks';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DailyPulseCard } from '@/features/dashboard/components/DailyPulseCard';
import { FastingCard } from '@/features/dashboard/components/FastingCard';
import { NutritionCard } from '@/features/dashboard/components/NutritionCard';
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
//
// DailyPulseCard is the single calorie/streak hero for the whole screen —
// there used to be two more cards (TodaySummary, CalorieBalanceCard) that
// each re-headlined the same net-calorie number in a different shape, plus
// metrics (fasting streak, activity kcal, meditation minutes) that were
// already shown on FastingCard/ActivityCard/MeditationCard below. Removed
// rather than recolored: same underlying data, one clear hero instead of
// three competing ones.
const SECTIONS = [DailyPulseCard, QuickActions, FastingCard, NutritionCard, ActivityCard, MeditationCard, WeightCard, GoalsCard];

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
