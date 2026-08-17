import React from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationHistory } from '@/features/meditation/selectors';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MeditationHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const history = useAppSelector(selectMeditationHistory);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="Meditation history" onBack={() => navigation.goBack()} />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md, flexGrow: 1 }}
        renderItem={({ item }) => (
          <AppCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="headingSmall">{item.meditationTitle}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {new Date(item.startedAt).toLocaleDateString()} · {Math.round(item.activeDurationSeconds / 60)} min
                </AppText>
              </View>
              <AppBadge label={item.status.replace('_', ' ')} tone={item.status === 'completed' ? 'success' : 'warning'} />
            </View>
          </AppCard>
        )}
        ListEmptyComponent={<AppEmptyState title="No sessions yet" />}
      />
    </SafeAreaView>
  );
};
