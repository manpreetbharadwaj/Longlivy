import React from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectTodayMeals } from '@/features/nutrition/selectors';
import { SafeAreaView } from 'react-native-safe-area-context';

export const NutritionHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const meals = useAppSelector(selectTodayMeals);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Nutrition history" onBack={() => navigation.goBack()} />
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: theme.spacing.sm }}>
            <AppText variant="headingSmall" style={{ textTransform: 'capitalize' }}>
              {item.mealType}
            </AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {new Date(item.timestamp).toLocaleString()} · {Math.round(item.totalCalories)} kcal
            </AppText>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState title="No history yet" message="Meals you log will build your nutrition history over time." />}
      />
    </SafeAreaView>
  );
};
