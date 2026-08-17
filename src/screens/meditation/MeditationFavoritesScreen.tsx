import React from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectFavoriteMeditations } from '@/features/meditation/selectors';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MeditationFavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const favorites = useAppSelector(selectFavoriteMeditations);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Favorites" onBack={() => navigation.goBack()} />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <AppCard
            onPress={() => navigation.navigate('MeditationPlayer', { meditationId: item.id, type: item.type, durationSeconds: item.durationSeconds })}
            style={{ marginBottom: theme.spacing.sm }}
          >
            <AppText variant="headingSmall">{item.title}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {Math.round(item.durationSeconds / 60)} min · {item.category}
            </AppText>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState icon="star-outline" title="No favorites yet" />}
      />
    </SafeAreaView>
  );
};
