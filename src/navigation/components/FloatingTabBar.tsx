import React from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/hooks/useTheme';
import { AppIconName } from '@/components/common/AppIcon';
import { MainTabParamList } from '../types';
import { TabItem } from './TabItem';
import { CenterActionButton } from './CenterActionButton';

const TAB_META: Record<keyof MainTabParamList, { active: AppIconName; inactive: AppIconName; label: string }> = {
  HomeTab: { active: 'home', inactive: 'home-outline', label: 'Home' },
  FastingTab: { active: 'timer', inactive: 'timer-outline', label: 'Fasting' },
  NutritionTab: { active: 'restaurant', inactive: 'restaurant-outline', label: 'Nutrition' },
  ActivityTab: { active: 'walk', inactive: 'walk-outline', label: 'Activity' },
  MeditationTab: { active: 'leaf', inactive: 'leaf-outline', label: 'Meditation' },
  StatisticsTab: { active: 'stats-chart', inactive: 'stats-chart-outline', label: 'Statistics' },
};

export const FLOATING_TAB_BAR_METRICS = {
  pillHeight: 64,
  centerSize: 62,
  // How far the center button sinks down into the pill from its own top edge —
  // the rest of it protrudes above the bar, which is what makes it read as
  // "raised" rather than just another (bigger) tab icon.
  centerOverlap: 26,
  pillMarginH: 18,
  pillMarginBottom: 10,
} as const;

const { pillHeight: PILL_HEIGHT, centerSize: CENTER_SIZE, centerOverlap: CENTER_OVERLAP, pillMarginH: PILL_MARGIN_H, pillMarginBottom: PILL_MARGIN_BOTTOM } =
  FLOATING_TAB_BAR_METRICS;
const TOP_SPACE = CENTER_SIZE - CENTER_OVERLAP;

/** The bar's total footprint (its own transparent top space + the pill + its bottom gap + the device's safe-area inset) — screens under it should add this much bottom padding to their scrollable content so nothing ends up hidden underneath the opaque pill. See useFloatingTabBarSpacing. */
export function getFloatingTabBarHeight(safeAreaBottom: number): number {
  return TOP_SPACE + PILL_HEIGHT + PILL_MARGIN_BOTTOM + safeAreaBottom;
}

/**
 * A floating, pill-shaped replacement for the flat default tab bar — six
 * icon-only tabs split 3-and-3 around a raised center action button, with
 * enough transparent margin above/below the pill that it visually detaches
 * from the screen edges rather than docking flush against them.
 *
 * Absolutely positioned over the screen content (not laid out as a normal
 * flex sibling) so there is no separate container reserving space — and
 * therefore no separate background layer that could ever show through as
 * a card behind it. What's visible around the bar is simply the current
 * screen's own background, unmodified, extending all the way down.
 * Because of that, every screen reachable while this bar is visible needs
 * to add `getFloatingTabBarHeight(insets.bottom)` of bottom padding to its
 * own scrollable content so the last item never ends up underneath the
 * opaque pill — see useFloatingTabBarSpacing, applied in TabHeroLayout,
 * FastingHeroLayout, ActivityHeroLayout and MeditationHeroLayout.
 */
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, navigation, insets }) => {
  const { theme } = useTheme();
  const routes = state.routes;
  const leftRoutes = routes.slice(0, 3);
  const rightRoutes = routes.slice(3, 6);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const meta = TAB_META[route.name as keyof MainTabParamList];

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return <TabItem key={route.key} icon={meta.inactive} activeIcon={meta.active} focused={focused} onPress={onPress} accessibilityLabel={meta.label} />;
  };

  return (
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: getFloatingTabBarHeight(insets.bottom) }}
      pointerEvents="box-none"
    >
      <View
        style={[
          {
            position: 'absolute',
            top: TOP_SPACE,
            left: PILL_MARGIN_H,
            right: PILL_MARGIN_H,
            height: PILL_HEIGHT,
            borderRadius: theme.radius.pill,
            backgroundColor: 'rgba(10,30,27,0.94)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.sm,
          },
          theme.shadows.floating,
        ]}
      >
        {leftRoutes.map(renderTab)}
        <View style={{ width: CENTER_SIZE }} />
        {rightRoutes.map(renderTab)}
      </View>

      <View style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -CENTER_SIZE / 2 }}>
        <CenterActionButton
          size={CENTER_SIZE}
          icon="flash"
          accessibilityLabel="Start fasting"
          onPress={() => navigation.navigate('FastingTab', { screen: 'SelectFastingMethod' })}
        />
      </View>
    </View>
  );
};
