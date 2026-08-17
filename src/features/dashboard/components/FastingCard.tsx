import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveFast } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

export const FastingCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const activeFast = useAppSelector(selectActiveFast);
  const progress = useFastingTimer(activeFast);

  return (
    <AppCard onPress={() => navigation.navigate('FastingTab', { screen: 'FastingHome' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppProgressRing progress={progress?.progress ?? 0} size={72} strokeWidth={8} color={theme.colors.fasting}>
          <AppIcon name="timer-outline" size={22} color={theme.colors.fasting} />
        </AppProgressRing>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <AppText variant="headingSmall">Fasting</AppText>
            {activeFast ? <View style={{ marginLeft: theme.spacing.xxs }}><AppBadge label="Active" tone="success" /></View> : null}
          </View>
          {activeFast && progress ? (
            <>
              <AppText variant="metricMedium">{formatDurationHM(progress.elapsedMs)}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                {progress.isOverdue ? 'Goal time reached' : `${formatDurationHM(progress.remainingMs)} remaining`} · {activeFast.method}
              </AppText>
            </>
          ) : (
            <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
              No active fast — tap to start one.
            </AppText>
          )}
        </View>
      </View>
    </AppCard>
  );
});

FastingCard.displayName = 'FastingCard';
