import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { HomeNavigator } from './HomeNavigator';
import { FastingNavigator } from './FastingNavigator';
import { NutritionNavigator } from './NutritionNavigator';
import { ActivityNavigator } from './ActivityNavigator';
import { MeditationNavigator } from './MeditationNavigator';
import { StatisticsNavigator } from './StatisticsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: AppIconName; inactive: AppIconName }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  FastingTab: { active: 'timer', inactive: 'timer-outline' },
  NutritionTab: { active: 'restaurant', inactive: 'restaurant-outline' },
  ActivityTab: { active: 'walk', inactive: 'walk-outline' },
  MeditationTab: { active: 'leaf', inactive: 'leaf-outline' },
  StatisticsTab: { active: 'stats-chart', inactive: 'stats-chart-outline' },
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Home',
  FastingTab: 'Fasting',
  NutritionTab: 'Nutrition',
  ActivityTab: 'Activity',
  MeditationTab: 'Meditation',
  StatisticsTab: 'Statistics',
};

export const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  // Edge-to-edge is mandatory from SDK 55 onward, so the tab bar can no
  // longer assume the OS leaves room for it above the Android gesture bar /
  // iOS home indicator — that inset has to be added to our own fixed height
  // explicitly instead of relying on a hardcoded paddingBottom.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: theme.componentSizes.tabBarHeight + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabel: ({ color }) => (
          <AppText variant="caption" color={color}>
            {LABELS[route.name as keyof MainTabParamList]}
          </AppText>
        ),
        tabBarIcon: ({ color, focused }) => {
          const icons = ICONS[route.name as keyof MainTabParamList];
          return <AppIcon name={focused ? icons.active : icons.inactive} size={theme.componentSizes.iconMedium} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="FastingTab" component={FastingNavigator} />
      <Tab.Screen name="NutritionTab" component={NutritionNavigator} />
      <Tab.Screen name="ActivityTab" component={ActivityNavigator} />
      <Tab.Screen name="MeditationTab" component={MeditationNavigator} />
      <Tab.Screen name="StatisticsTab" component={StatisticsNavigator} />
    </Tab.Navigator>
  );
};
