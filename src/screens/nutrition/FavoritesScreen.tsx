import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFavoriteFoods } from '@/features/nutrition/nutritionSlice';
import { selectFavoriteFoods } from '@/features/nutrition/selectors';

export const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavoriteFoods);

  useEffect(() => {
    dispatch(loadFavoriteFoods());
  }, [dispatch]);

  return (
    <TabHeroLayout title="Favorites" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {item.name}
              </AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
                {item.calories} kcal
              </AppText>
            </View>
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
              <AppIcon name="star-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No favorites yet
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
              Star foods from the search screen to see them here.
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
