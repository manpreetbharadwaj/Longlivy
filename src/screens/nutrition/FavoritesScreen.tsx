import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFavoriteFoods } from '@/features/nutrition/nutritionSlice';
import { selectFavoriteFoods } from '@/features/nutrition/selectors';
import { SafeAreaView } from 'react-native-safe-area-context';

export const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavoriteFoods);

  useEffect(() => {
    dispatch(loadFavoriteFoods());
  }, [dispatch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Favorites" onBack={() => navigation.goBack()} />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="headingSmall">{item.name}</AppText>
              <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
                {item.calories} kcal
              </AppText>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState icon="star-outline" title="No favorites yet" message="Star foods from the search screen to see them here." />}
      />
    </SafeAreaView>
  );
};
