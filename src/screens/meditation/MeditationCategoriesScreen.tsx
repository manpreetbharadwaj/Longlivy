import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroChip } from '@/components/common/HeroChip';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationContent } from '@/features/meditation/selectors';
import { MEDITATION_CATEGORIES, Meditation } from '@/features/meditation/models';

export const MeditationCategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const content = useAppSelector(selectMeditationContent);
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => (category ? content.filter((m) => m.category === category) : content), [content, category]);

  const renderItem = useCallback(
    ({ item }: { item: Meditation }) => (
      <HeroCard onPress={() => navigation.navigate('MeditationDetails', { meditationId: item.id })} style={{ marginBottom: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF">
          {item.title}
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }}>
          {item.category} · {Math.round(item.durationSeconds / 60)} min
        </AppText>
      </HeroCard>
    ),
    [navigation, theme]
  );

  return (
    <TabHeroLayout title="Guided meditations" onBack={() => navigation.goBack()} scroll={false}>
      <View style={{ marginBottom: theme.spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...MEDITATION_CATEGORIES]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <HeroChip label={item} selected={item === 'All' ? category === null : category === item} onPress={() => setCategory(item === 'All' ? null : item)} />
          )}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
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
              <AppIcon name="file-tray-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No meditations in this category
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
