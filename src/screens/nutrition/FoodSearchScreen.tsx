import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchFoodsThunk } from '@/features/nutrition/nutritionSlice';
import { selectFoodSearchResults, selectFoodSearchStatus } from '@/features/nutrition/selectors';
import { useDebounce } from '@/hooks/useDebounce';
import { Food } from '@/features/nutrition/models';

export const FoodSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const route = useRoute<RouteProp<NutritionStackParamList, 'FoodSearch'>>();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const results = useAppSelector(selectFoodSearchResults);
  const status = useAppSelector(selectFoodSearchStatus);

  useEffect(() => {
    dispatch(searchFoodsThunk(debouncedQuery));
  }, [debouncedQuery, dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: Food }) => (
      <HeroCard onPress={() => navigation.navigate('AddFood', { foodId: item.id, mealType: route.params.mealType })} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF">
              {item.name}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {item.brand ? `${item.brand} · ` : ''}
              {item.category}
            </AppText>
          </View>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
            {item.calories} kcal / {item.servingSize}
            {item.unit}
          </AppText>
        </View>
      </HeroCard>
    ),
    [navigation, route.params.mealType, theme]
  );

  return (
    <TabHeroLayout title={`Add to ${route.params.mealType}`} onBack={() => navigation.goBack()} scroll={false}>
      <View style={{ marginBottom: theme.spacing.sm }}>
        <HeroTextField placeholder="Search foods, brands, categories…" value={query} onChangeText={setQuery} autoFocus />
        <Pressable onPress={() => navigation.navigate('MyFoods')} accessibilityRole="button" style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start' }}>
          <AppText variant="bodySmall" color="#22D3EE">
            Create own food instead
          </AppText>
        </Pressable>
      </View>
      {status === 'loading' ? (
        <View style={{ paddingVertical: theme.spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                <AppIcon name="search-outline" size={30} color="rgba(255,255,255,0.5)" />
              </View>
              <AppText variant="headingSmall" color="#FFFFFF" align="center">
                No foods found
              </AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
                Try a different search term, or create your own food entry.
              </AppText>
            </View>
          }
        />
      )}
    </TabHeroLayout>
  );
};
