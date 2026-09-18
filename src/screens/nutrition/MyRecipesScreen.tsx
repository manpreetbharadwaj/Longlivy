import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';
import { nutritionRepository } from '@/features/nutrition/repository/MockNutritionRepository';
import { Recipe } from '@/features/nutrition/models';
import { DEMO_USER_ID } from '@/mock/demoUser';

const NUTRITION_GRADIENT = ['#D6A253', '#8C6423'] as const;

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
    <TabHeroLayout title="My recipes" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <AppGradientButton label="Create recipe" onPress={() => navigation.navigate('CreateRecipe')} colors={NUTRITION_GRADIENT} style={{ marginBottom: theme.spacing.md }} />
        }
        renderItem={({ item }) => (
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF">
              {item.name}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {item.servings} servings · {Math.round(item.totalCalories / item.servings)} kcal/serving
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
              <AppIcon name="book-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No recipes yet
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
              Build a recipe from ingredients to reuse it in one tap.
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
