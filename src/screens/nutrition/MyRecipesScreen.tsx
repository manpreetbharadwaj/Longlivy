import React, { useEffect, useState, useCallback } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Recipe } from '@/features/nutrition/models';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MyRecipesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const load = useCallback(() => {
    nutritionRepository.getRecipes(DEMO_USER_ID).then(setRecipes);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="My recipes" onBack={() => navigation.goBack()} />
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        ListHeaderComponent={<AppButton label="Create recipe" onPress={() => navigation.navigate('CreateRecipe')} style={{ marginBottom: theme.spacing.md }} />}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: theme.spacing.sm }}>
            <AppText variant="headingSmall">{item.name}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {item.servings} servings · {Math.round(item.totalCalories / item.servings)} kcal/serving
            </AppText>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState title="No recipes yet" message="Build a recipe from ingredients to reuse it in one tap." />}
      />
    </SafeAreaView>
  );
};
