import React from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectTodayMeals } from '@/features/nutrition/selectors';

export const NutritionHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const meals = useAppSelector(selectTodayMeals);

  return (
    <TabHeroLayout title="Nutrition history" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
              {item.mealType}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {new Date(item.timestamp).toLocaleString()} · {Math.round(item.totalCalories)} kcal
            </AppText>
          </HeroCard>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <AppIcon name="time-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No history yet
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
              Meals you log will build your nutrition history over time.
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
