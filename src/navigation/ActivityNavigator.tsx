import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityStackParamList } from './types';
import { ActivityHomeScreen } from '@/screens/activity/ActivityHomeScreen';
import { SelectActivityScreen } from '@/screens/activity/SelectActivityScreen';
import { ActiveActivityScreen } from '@/screens/activity/ActiveActivityScreen';
import { ActivitySummaryScreen } from '@/screens/activity/ActivitySummaryScreen';
import { ActivityHistoryScreen } from '@/screens/activity/ActivityHistoryScreen';
import { ActivityDetailsScreen } from '@/screens/activity/ActivityDetailsScreen';
import { ManualActivityScreen } from '@/screens/activity/ManualActivityScreen';

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export const ActivityNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ActivityHome" component={ActivityHomeScreen} />
    <Stack.Screen name="SelectActivity" component={SelectActivityScreen} />
    <Stack.Screen name="ActiveActivity" component={ActiveActivityScreen} />
    <Stack.Screen name="ActivitySummary" component={ActivitySummaryScreen} />
    <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
    <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} />
    <Stack.Screen name="ManualActivity" component={ManualActivityScreen} />
  </Stack.Navigator>
);
