import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppChip } from '@/components/common/AppChip';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationContent } from '@/features/meditation/selectors';
import { MEDITATION_CATEGORIES, Meditation } from '@/features/meditation/models';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MeditationCategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const content = useAppSelector(selectMeditationContent);
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => (category ? content.filter((m) => m.category === category) : content), [content, category]);

  const renderItem = useCallback(
    ({ item }: { item: Meditation }) => (
      <AppCard onPress={() => navigation.navigate('MeditationDetails', { meditationId: item.id })} style={{ marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall">{item.title}</AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: 2 }}>
          {item.category} · {Math.round(item.durationSeconds / 60)} min
        </AppText>
      </AppCard>
    ),
    [navigation, theme]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Guided meditations" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...MEDITATION_CATEGORIES]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <AppChip label={item} selected={item === 'All' ? category === null : category === item} onPress={() => setCategory(item === 'All' ? null : item)} />
          )}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: theme.spacing.md, paddingTop: 0, flexGrow: 1 }}
        ListEmptyComponent={<AppEmptyState title="No meditations in this category" />}
      />
    </SafeAreaView>
  );
};
