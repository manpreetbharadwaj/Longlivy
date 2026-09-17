import React from 'react';
import { View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/hooks/useTheme';
import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { MainTabParamList } from '../types';
import { TabItem } from './TabItem';
import { CenterActionButton } from './CenterActionButton';
import { dashboardFloatingStyle } from '@/features/dashboard/dashboardTheme';

const TAB_META: Record<
  keyof MainTabParamList,
  {
    active: AppIconName | MaterialCommunityIconName;
    inactive: AppIconName | MaterialCommunityIconName;
    labelKey: TranslationKey;
    family?: 'ionicons' | 'material-community';
  }
> = {
  // Hidden from the bar's visible icon row (see visibleRoutes below) — kept
  // here only because TAB_META must cover every registered tab route.
  HomeTab: { active: 'home', inactive: 'home-outline', labelKey: 'tabs.home' },
  ProfileTab: { active: 'person-circle', inactive: 'person-circle-outline', labelKey: 'tabs.profile' },
  FastingTab: { active: 'timer', inactive: 'timer-outline', labelKey: 'tabs.fasting' },
  NutritionTab: { active: 'restaurant', inactive: 'restaurant-outline', labelKey: 'tabs.nutrition' },
  ActivityTab: { active: 'walk', inactive: 'walk-outline', labelKey: 'tabs.activity' },
  // MaterialCommunityIcons has no separate outline glyph for this figure —
  // active/inactive is still communicated via the usual color change.
  MeditationTab: { active: 'meditation', inactive: 'meditation', labelKey: 'tabs.meditation', family: 'material-community' },
  StatisticsTab: { active: 'stats-chart', inactive: 'stats-chart-outline', labelKey: 'tabs.statistics' },
};

export const FLOATING_TAB_BAR_METRICS = {
  // Tall enough to fit an icon + a small label underneath it without
  // cramping — the bar reads as icon-only no longer (see TabItem).
  pillHeight: 72,
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

// A fixed, deliberately soft shadow for the pill — hardcoded rather than
// theme.shadows.floating so the bar reads the same "gentle lift" regardless
// of system light/dark mode.
const TAB_BAR_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
} as const;

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
 * FastingHeroLayout, ActivityHeroLayout and every screen built directly on
 * SectionHeroLayout (Home, the Meditation flow, etc.).
 */
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation, insets }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const routes = state.routes;

  // A custom `tabBar` render prop (like this one) isn't auto-hidden by the
  // default navigator the way its built-in bar is — it still receives
  // `state` regardless of options. Honor the standard per-screen
  // `tabBarStyle: { display: 'none' }` convention ourselves so immersive
  // screens (an active meditation session) can hide the bar the normal
  // React Navigation way.
  const focusedRoute = state.routes[state.index];
  const focusedTabBarStyle = descriptors[focusedRoute.key]?.options.tabBarStyle;
  const isHidden = !!focusedTabBarStyle && typeof focusedTabBarStyle === 'object' && (focusedTabBarStyle as { display?: string }).display === 'none';
  if (isHidden) return null;
  // HomeTab is registered (the center button navigates to it) but stays out
  // of the bar's own icon row — Profile occupies that leftmost slot instead.
  const visibleRoutes = routes.filter((r) => r.name !== 'HomeTab');
  const leftRoutes = visibleRoutes.slice(0, 3);
  const rightRoutes = visibleRoutes.slice(3, 6);
  const homeRoute = routes.find((r) => r.name === 'HomeTab');
  const isHomeFocused = state.routes[state.index]?.name === 'HomeTab';

  // The Home tab icon (leftRoutes[0]) and the center button both lead to
  // Home, deliberately — they're not redundant. The tab icon is a normal
  // tab switch; the center button is a global "return to the command
  // center" action that resets the Home stack to its root and scrolls it
  // to top even when Home is already focused (matching how a real tab
  // re-press behaves — see useScrollToTop in HomeDashboardScreen).
  const goHome = () => {
    navigation.navigate('HomeTab', { screen: 'HomeDashboard' });
    if (homeRoute) {
      navigation.emit({ type: 'tabPress', target: homeRoute.key, canPreventDefault: true });
    }
  };

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

    const label = t(meta.labelKey);
    return (
      <TabItem
        key={route.key}
        icon={meta.inactive}
        activeIcon={meta.active}
        iconFamily={meta.family}
        label={label}
        focused={focused}
        onPress={onPress}
        accessibilityLabel={label}
      />
    );
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
            borderRadius: theme.radius.xl,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.xs,
          },
          dashboardFloatingStyle,
          TAB_BAR_SHADOW,
        ]}
      >
        {leftRoutes.map(renderTab)}
        <View style={{ width: CENTER_SIZE }} />
        {rightRoutes.map(renderTab)}
      </View>

      <View style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -CENTER_SIZE / 2 }}>
        <CenterActionButton size={CENTER_SIZE} icon="home" accessibilityLabel={t('nav.goHome')} active={isHomeFocused} onPress={goHome} />
      </View>
    </View>
  );
};
