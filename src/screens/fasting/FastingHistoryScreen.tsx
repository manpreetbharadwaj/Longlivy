import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectFastingHistory } from '@/features/fasting/selectors';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { FastingSession, FastingStatus } from '@/features/fasting/models';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_TONE: Record<FastingStatus, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  completed: 'success',
  ended_prematurely: 'warning',
  extended: 'info',
  planned: 'neutral',
  active: 'info',
  cancelled: 'danger',
};

export const FastingHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const history = useAppSelector(selectFastingHistory);

  const renderItem = useCallback(
    ({ item }: { item: FastingSession }) => (
      <AppCard style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText variant="headingSmall">{item.method}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {new Date(item.startTimestamp).toLocaleDateString()} · {formatDurationHM(item.actualDuration ?? item.plannedDuration)}
            </AppText>
          </View>
          <AppBadge label={item.status.replace('_', ' ')} tone={STATUS_TONE[item.status]} />
        </View>
      </AppCard>
    ),
    [theme]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Fasting history" onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        ListEmptyComponent={<AppEmptyState title="No fasting history yet" message="Completed and ended fasts will appear here." />}
      />
    </SafeAreaView>
  );
};
