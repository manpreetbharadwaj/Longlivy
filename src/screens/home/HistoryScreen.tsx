import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppChip } from '@/components/common/AppChip';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation, useDateLocale } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUnifiedHistory, selectHistoryActiveFilters } from '@/features/history/selectors';
import { toggleHistoryFilter } from '@/features/history/historySlice';
import { HistoryCategory, HistoryItem } from '@/features/history/models';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES: { key: HistoryCategory; icon: AppIconName }[] = [
  { key: 'fasting', icon: 'timer-outline' },
  { key: 'nutrition', icon: 'restaurant-outline' },
  { key: 'activity', icon: 'walk-outline' },
  { key: 'weight', icon: 'scale-outline' },
  { key: 'meditation', icon: 'leaf-outline' },
];

const ICON: Record<HistoryCategory, AppIconName> = {
  fasting: 'timer-outline',
  nutrition: 'restaurant-outline',
  activity: 'walk-outline',
  weight: 'scale-outline',
  meditation: 'leaf-outline',
};

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectUnifiedHistory);
  const activeFilters = useAppSelector(selectHistoryActiveFilters);

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => (
      <AppCard style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIconTile name={ICON[item.category]} color={theme.colors[item.category]} size={36} iconSize={18} style={{ marginRight: theme.spacing.sm }} />
          <View style={{ flex: 1 }}>
            <AppText variant="headingSmall">{item.title}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {item.subtitle}
            </AppText>
          </View>
          <AppText variant="caption" color={theme.colors.textTertiary}>
            {new Date(item.timestamp).toLocaleDateString(dateLocale)}
          </AppText>
        </View>
      </AppCard>
    ),
    [theme, dateLocale]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title={t('history.title')} onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.key}
          renderItem={({ item }) => (
            <AppChip icon={item.icon} label={t(`history.filters.${item.key}`)} selected={activeFilters.includes(item.key)} onPress={() => dispatch(toggleHistoryFilter(item.key))} />
          )}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: theme.spacing.md, paddingTop: 0, flexGrow: 1 }}
        ListEmptyComponent={<AppEmptyState title={t('history.emptyTitle')} message={t('history.emptyMessage')} />}
      />
    </SafeAreaView>
  );
};
