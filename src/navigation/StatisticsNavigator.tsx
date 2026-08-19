import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatisticsStackParamList } from './types';
import { StatisticsScreen } from '@/screens/home/StatisticsScreen';

const Stack = createNativeStackNavigator<StatisticsStackParamList>();

export const StatisticsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StatisticsHome" component={StatisticsScreen} />
  </Stack.Navigator>
);
