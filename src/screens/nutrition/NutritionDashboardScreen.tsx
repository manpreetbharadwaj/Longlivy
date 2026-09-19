import React, { useEffect, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppProgressBar } from '@/components/common/AppProgressBar';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { loadTodayMeals } from '@/features/nutrition/nutritionSlice';
import { selectDailyNutritionTotals, selectNutritionProgress, selectTodayMeals } from '@/features/nutrition/selectors';
import { MealType } from '@/features/nutrition/models';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

const MEAL_TYPES: { key: MealType; icon: AppIconName }[] = [
  { key: 'breakfast', icon: 'cafe-outline' },
  { key: 'lunch', icon: 'restaurant-outline' },
  { key: 'dinner', icon: 'fast-food-outline' },
  { key: 'snack', icon: 'nutrition-outline' },
];

const QUICK_LINKS: { labelKey: TranslationKey; icon: AppIconName; nav: keyof NutritionStackParamList }[] = [
  { labelKey: 'nutrition.quickAdd.barcode', icon: 'barcode-outline', nav: 'BarcodeScanner' },
  { labelKey: 'nutrition.quickAdd.aiPhoto', icon: 'camera-outline', nav: 'AiPhotoEntry' },
  { labelKey: 'nutrition.quickAdd.aiVoice', icon: 'mic-outline', nav: 'AiVoiceEntry' },
  { labelKey: 'nutrition.quickAdd.aiText', icon: 'chatbubble-ellipses-outline', nav: 'AiTextEntry' },
];

export const NutritionDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const dispatch = useAppDispatch();
  const meals = useAppSelector(selectTodayMeals);
  const totals = useAppSelector(selectDailyNutritionTotals);
  const progress = useAppSelector(selectNutritionProgress);
  const ringProgress = useAnimatedProgress(progress.calories.percentage / 100);

  useEffect(() => {
    dispatch(loadTodayMeals());
  }, [dispatch]);

  const mealFor = useCallback((type: MealType) => meals.find((m) => m.mealType === type), [meals]);

  return (
    <SectionHeroLayout environment={sectionEnvironments.nutrition} title={t('nutrition.title')}>
      <HeroCard style={[dashboardCardStyle, { alignItems: 'center', marginBottom: theme.spacing.md, overflow: 'hidden' }]}>
        <AppProgressRing progress={ringProgress} size={160} strokeWidth={12} color={progress.calories.exceeded ? dashboardColors.warning : '#C9974E'} trackColor={dashboardColors.border} glow>
          <AnimatedNumberText value={Math.round(totals.calories)} variant="metricMedium" color={dashboardColors.textPrimary} />
          <AppText variant="caption" color={dashboardColors.textMuted}>
            {t('nutrition.ofKcal', { target: progress.calories.target })}
          </AppText>
        </AppProgressRing>
        <AppText variant="bodyMedium" style={{ marginTop: theme.spacing.sm }} color={progress.calories.exceeded ? dashboardColors.warning : dashboardColors.textSecondary}>
          {progress.calories.exceeded
            ? t('nutrition.goalExceededBy', { amount: Math.round(progress.calories.exceededBy) })
            : t('nutrition.kcalRemaining', { amount: Math.round(progress.calories.remaining) })}
        </AppText>
        <CardShimmer delay={400} />
      </HeroCard>

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
        <MacroTile index={0} label={t('nutrition.macros.protein')} icon="egg-outline" progress={progress.protein} color="#C9974E" />
        <MacroTile index={1} label={t('nutrition.macros.carbs')} icon="pizza-outline" progress={progress.carbohydrates} color="#6E8FAE" />
        <MacroTile index={2} label={t('nutrition.macros.fat')} icon="water-outline" progress={progress.fat} color="#8B7FA8" isLast />
      </View>

      {MEAL_TYPES.map((mt, index) => {
        const meal = mealFor(mt.key);
        return (
          <FadeSlideIn key={mt.key} delay={index * motion.staggerStepMs} fromY={8}>
            <HeroCard onPress={() => navigation.navigate('FoodSearch', { mealType: mt.key })} style={[dashboardCardStyle, { marginBottom: theme.spacing.sm }]} scaleOnPress>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      backgroundColor: dashboardColors.surfaceSecondary,
                      borderWidth: 1,
                      borderColor: dashboardColors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing.sm,
                    }}
                  >
                    <AppIcon name={mt.icon} size={20} color="#C9974E" />
                  </View>
                  <View>
                    <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
                      {t(`enums.meal.${mt.key}`)}
                    </AppText>
                    <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                      {meal
                        ? t('nutrition.itemsSummary', { kcal: Math.round(meal.totalCalories), count: meal.items.length })
                        : t('nutrition.noItemsLogged')}
                    </AppText>
                  </View>
                </View>
                <AppIcon name="add-circle-outline" size={26} color={dashboardColors.accent} />
              </View>
            </HeroCard>
          </FadeSlideIn>
        );
      })}

      {meals.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
          <AppText variant="headingSmall" color={dashboardColors.textPrimary} align="center">
            {t('nutrition.emptyTitle')}
          </AppText>
          <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginTop: theme.spacing.xxs }}>
            {t('nutrition.emptyMessage')}
          </AppText>
        </View>
      ) : null}

      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        {t('nutrition.quickAddTitle')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md, marginHorizontal: -theme.spacing.xxs }}>
        {QUICK_LINKS.map((link, index) => (
          <View key={link.nav} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.xs }}>
            <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
              <Pressable
                onPress={() => navigation.navigate(link.nav as never)}
                accessibilityRole="button"
                accessibilityLabel={t(link.labelKey)}
                style={({ pressed }) => [dashboardCardStyle, { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, opacity: pressed ? 0.85 : 1 }]}
              >
                <AppIcon name={link.icon} size={18} color={dashboardColors.accent} />
                <AppText variant="bodyMedium" weight="600" color={dashboardColors.textPrimary} style={{ marginLeft: 8 }}>
                  {t(link.labelKey)}
                </AppText>
              </Pressable>
            </FadeSlideIn>
          </View>
        ))}
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <ListRow index={0} icon="book-outline" label={t('nutrition.menu.recipes')} onPress={() => navigation.navigate('MyRecipes')} />
        <ListRow index={1} icon="fast-food-outline" label={t('nutrition.menu.foods')} onPress={() => navigation.navigate('MyFoods')} />
        <ListRow index={2} icon="heart-outline" label={t('nutrition.menu.favorites')} onPress={() => navigation.navigate('Favorites')} />
        <ListRow index={3} icon="flag-outline" label={t('nutrition.menu.goals')} onPress={() => navigation.navigate('NutritionGoalsScreen')} />
        <ListRow index={4} icon="time-outline" label={t('nutrition.menu.history')} onPress={() => navigation.navigate('NutritionHistory')} isLast />
      </View>
    </SectionHeroLayout>
  );
};

const MacroTile: React.FC<{ index: number; label: string; icon: AppIconName; progress: { current: number; target: number; percentage: number; exceeded: boolean }; color: string; isLast?: boolean }> = React.memo(
  ({ index, label, icon, progress, color, isLast }) => {
    const { theme } = useTheme();
    // Mirrors the Home dashboard's NutritionCard macro rows — same
    // useAnimatedProgress -> AppProgressBar chain, same per-macro colors, so
    // the two places the app shows macro progress stay visually consistent.
    const animatedFraction = useAnimatedProgress(progress.percentage / 100);
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8} style={{ flex: 1, marginRight: isLast ? 0 : theme.spacing.xs }}>
        <View style={[dashboardCardStyle, { padding: theme.spacing.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: theme.radius.sm,
                backgroundColor: `${color}26`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 5,
              }}
            >
              <AppIcon name={icon} size={12} color={color} />
            </View>
            <AppText variant="caption" color={dashboardColors.textMuted}>
              {label}
            </AppText>
          </View>
          <AppText variant="headingSmall" color={progress.exceeded ? dashboardColors.warning : dashboardColors.textPrimary}>
            <AnimatedNumberText value={Math.round(progress.current)} variant="headingSmall" color={progress.exceeded ? dashboardColors.warning : dashboardColors.textPrimary} />
            g
          </AppText>
          <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginBottom: theme.spacing.xs }}>
            / {progress.target}g
          </AppText>
          <AppProgressBar progress={animatedFraction} color={color} trackColor={dashboardColors.border} height={5} />
        </View>
      </FadeSlideIn>
    );
  }
);
MacroTile.displayName = 'MacroTile';

const ListRow: React.FC<{ index: number; icon: AppIconName; label: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, label, onPress, isLast }) => {
    const { theme } = useTheme();
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            dashboardCardStyle,
            { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, marginBottom: isLast ? 0 : theme.spacing.sm, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: dashboardColors.surfaceSecondary,
              borderWidth: 1,
              borderColor: dashboardColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <AppIcon name={icon} size={18} color={dashboardColors.accent} />
          </View>
          <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary} style={{ flex: 1 }}>
            {label}
          </AppText>
          <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
        </Pressable>
      </FadeSlideIn>
    );
  }
);
ListRow.displayName = 'ListRow';
