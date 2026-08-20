import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeNavigator } from './HomeNavigator';
import { FastingNavigator } from './FastingNavigator';
import { NutritionNavigator } from './NutritionNavigator';
import { ActivityNavigator } from './ActivityNavigator';
import { MeditationNavigator } from './MeditationNavigator';
import { StatisticsNavigator } from './StatisticsNavigator';
import { FloatingTabBar } from './components/FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      // 'shift' cross-fades and gives the outgoing/incoming screens a small
      // horizontal shift — built into bottom-tabs v7, so switching tabs
      // feels connected to the new floating bar without a bespoke
      // transition implementation.
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <FloatingTabBar {...props} />}
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
