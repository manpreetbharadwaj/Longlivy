import React from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationHistory } from '@/features/meditation/selectors';

export const MeditationHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const history = useAppSelector(selectMeditationHistory);

  return (
    <TabHeroLayout title="Meditation history" onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HeroCard style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <AppText variant="headingSmall" color="#FFFFFF">
                  {item.meditationTitle}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {new Date(item.startedAt).toLocaleDateString()} · {Math.round(item.activeDurationSeconds / 60)} min
                </AppText>
              </View>
              <AppBadge label={item.status.replace('_', ' ')} tone={item.status === 'completed' ? 'success' : 'warning'} />
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
              <AppIcon name="file-tray-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No sessions yet
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
