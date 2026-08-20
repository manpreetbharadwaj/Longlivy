import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveFast } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';

export const FastingCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const activeFast = useAppSelector(selectActiveFast);
  const progress = useFastingTimer(activeFast);
  // Eases toward each new tick rather than snapping — reads as the ring
  // "filling" on mount and gliding forward each second instead of a
  // robotic per-second jump.
  const animatedProgress = useAnimatedProgress(progress?.progress ?? 0);

  return (
    <HeroCard onPress={() => navigation.navigate('FastingTab', { screen: 'FastingHome' })} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppProgressRing progress={animatedProgress} size={72} strokeWidth={8} color="#5FBFAE" trackColor="rgba(255,255,255,0.12)">
          <AppIcon name="timer-outline" size={22} color="#5FBFAE" />
        </AppProgressRing>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <AppText variant="headingSmall" color="#FFFFFF">
              Fasting
            </AppText>
            {activeFast ? (
              <FadeSlideIn delay={250} fromY={4}>
                <View style={{ marginLeft: theme.spacing.xxs }}>
                  <AppBadge label="Active" tone="success" />
                </View>
              </FadeSlideIn>
            ) : null}
          </View>
          {activeFast && progress ? (
            <>
              <AppText variant="metricMedium" color="#FFFFFF">
                {formatDurationHM(progress.elapsedMs)}
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                {progress.isOverdue ? 'Goal time reached' : `${formatDurationHM(progress.remainingMs)} remaining`} · {activeFast.method}
              </AppText>
            </>
          ) : (
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
              No active fast — tap to start one.
            </AppText>
          )}
        </View>
      </View>
    </HeroCard>
  );
});

FastingCard.displayName = 'FastingCard';
