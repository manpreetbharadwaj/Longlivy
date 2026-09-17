import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MeditationStackParamList } from './types';
import { MeditationHomeScreen } from '@/screens/meditation/MeditationHomeScreen';
import { MeditationCategoriesScreen } from '@/screens/meditation/MeditationCategoriesScreen';
import { MeditationDetailsScreen } from '@/screens/meditation/MeditationDetailsScreen';
import { MeditationPlayerScreen } from '@/screens/meditation/MeditationPlayerScreen';
import { BreathingExerciseScreen } from '@/screens/meditation/BreathingExerciseScreen';
import { MeditationFavoritesScreen } from '@/screens/meditation/MeditationFavoritesScreen';
import { MeditationTemplatesScreen } from '@/screens/meditation/MeditationTemplatesScreen';
import { MeditationGoalsScreen } from '@/screens/meditation/MeditationGoalsScreen';
import { MeditationHistoryScreen } from '@/screens/meditation/MeditationHistoryScreen';
import { MeditationStatisticsScreen } from '@/screens/meditation/MeditationStatisticsScreen';
import { MeditationRemindersScreen } from '@/screens/meditation/MeditationRemindersScreen';

const Stack = createNativeStackNavigator<MeditationStackParamList>();

export const MeditationNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MeditationHome" component={MeditationHomeScreen} />
    <Stack.Screen name="MeditationCategories" component={MeditationCategoriesScreen} />
    <Stack.Screen name="MeditationDetails" component={MeditationDetailsScreen} />
    {/* gestureEnabled: false — both screens have a live audio session +
        in-progress Meditation record; an iOS edge-swipe dismissal would
        bypass requestExit()/finish() entirely, leaving audio playing and the
        session stuck unfinished. The screens' own back button/Android
        hardware-back handling already routes through the correct cleanup
        path (QA finding, see MeditationPlayerScreen/BreathingExerciseScreen). */}
    <Stack.Screen name="MeditationPlayer" component={MeditationPlayerScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="BreathingExercise" component={BreathingExerciseScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="MeditationFavorites" component={MeditationFavoritesScreen} />
    <Stack.Screen name="MeditationTemplates" component={MeditationTemplatesScreen} />
    <Stack.Screen name="MeditationGoalsScreen" component={MeditationGoalsScreen} />
    <Stack.Screen name="MeditationHistory" component={MeditationHistoryScreen} />
    <Stack.Screen name="MeditationStatistics" component={MeditationStatisticsScreen} />
    <Stack.Screen name="MeditationReminders" component={MeditationRemindersScreen} />
  </Stack.Navigator>
);
