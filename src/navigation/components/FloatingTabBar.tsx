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

const PILL_HEIGHT = 64;
const CENTER_SIZE = 62;
// How far the center button sinks down into the pill from its own top edge —
// the rest of it protrudes above the bar, which is what makes it read as
// "raised" rather than just another (bigger) tab icon.
const CENTER_OVERLAP = 26;
const TOP_SPACE = CENTER_SIZE - CENTER_OVERLAP;
const PILL_MARGIN_H = 18;
const PILL_MARGIN_BOTTOM = 10;

/**
 * A floating, pill-shaped replacement for the flat default tab bar — six
 * icon-only tabs split 3-and-3 around a raised center action button, with
 * enough transparent margin above/below the pill that it visually detaches
 * from the screen edges rather than docking flush against them. Rendered
 * via React Navigation's `tabBar` prop, so it participates in the normal
 * tab-navigator layout (screens size themselves above whatever height this
 * component reports) — no per-screen padding changes needed anywhere else.
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
    <View style={{ height: TOP_SPACE + PILL_HEIGHT + PILL_MARGIN_BOTTOM + insets.bottom }} pointerEvents="box-none">
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
