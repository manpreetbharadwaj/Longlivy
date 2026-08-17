import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { HomeNavigator } from './HomeNavigator';
import { FastingNavigator } from './FastingNavigator';
import { NutritionNavigator } from './NutritionNavigator';
import { ActivityNavigator } from './ActivityNavigator';
import { MeditationNavigator } from './MeditationNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, { active: AppIconName; inactive: AppIconName }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  FastingTab: { active: 'timer', inactive: 'timer-outline' },
  NutritionTab: { active: 'restaurant', inactive: 'restaurant-outline' },
  ActivityTab: { active: 'walk', inactive: 'walk-outline' },
  MeditationTab: { active: 'leaf', inactive: 'leaf-outline' },
};

const LABELS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'Home',
  FastingTab: 'Fasting',
  NutritionTab: 'Nutrition',
  ActivityTab: 'Activity',
  MeditationTab: 'Meditation',
};

export const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: theme.componentSizes.tabBarHeight,
          paddingBottom: 8,
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
    </Tab.Navigator>
  );
};
