import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppInput } from '@/components/common/AppInput';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppLoader } from '@/components/common/AppLoader';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { searchFoodsThunk } from '@/features/nutrition/nutritionSlice';
import { selectFoodSearchResults, selectFoodSearchStatus } from '@/features/nutrition/selectors';
import { useDebounce } from '@/hooks/useDebounce';
import { Food } from '@/features/nutrition/models';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      <AppCard onPress={() => navigation.navigate('AddFood', { foodId: item.id, mealType: route.params.mealType })} style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppText variant="headingSmall">{item.name}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {item.brand ? `${item.brand} · ` : ''}
              {item.category}
            </AppText>
          </View>
          <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
            {item.calories} kcal / {item.servingSize}{item.unit}
          </AppText>
        </View>
      </AppCard>
    ),
    [navigation, route.params.mealType, theme]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title={`Add to ${route.params.mealType}`} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
        <AppInput placeholder="Search foods, brands, categories…" value={query} onChangeText={setQuery} autoFocus />
        <AppButton label="Create own food instead" variant="ghost" fullWidth={false} onPress={() => navigation.navigate('MyFoods')} style={{ marginTop: theme.spacing.xs, alignSelf: 'flex-start', height: 32 }} />
      </View>
      {status === 'loading' ? (
        <AppLoader />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: theme.spacing.md, paddingTop: 0, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<AppEmptyState title="No foods found" message="Try a different search term, or create your own food entry." />}
        />
      )}
    </SafeAreaView>
  );
};
