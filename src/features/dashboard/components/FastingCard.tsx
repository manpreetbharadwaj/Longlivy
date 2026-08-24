import React from 'react';
import { View, Pressable } from 'react-native';
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
import { dashboardColors, dashboardCardStyle } from '../dashboardTheme';

export const FastingCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const activeFast = useAppSelector(selectActiveFast);
  const progress = useFastingTimer(activeFast);
  // Eases toward each new tick rather than snapping — reads as the ring
  // "filling" on mount and gliding forward each second instead of a
  // robotic per-second jump.
  const animatedProgress = useAnimatedProgress(progress?.progress ?? 0);
  const goToFasting = () => navigation.navigate('FastingTab', { screen: 'FastingHome' });

  return (
    <HeroCard onPress={goToFasting} style={[dashboardCardStyle, { marginBottom: theme.spacing.sm }]} scaleOnPress>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppProgressRing progress={animatedProgress} size={72} strokeWidth={7} color={dashboardColors.accent} trackColor={dashboardColors.border}>
          <AppIcon name="timer-outline" size={22} color={dashboardColors.accent} />
        </AppProgressRing>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <AppText variant="label" color={dashboardColors.accent} style={{ letterSpacing: 0.5 }}>
              FASTING
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
              <AppText variant="metricMedium" color={dashboardColors.textPrimary}>
                {formatDurationHM(progress.elapsedMs)}
              </AppText>
              <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                {progress.isOverdue ? 'Goal time reached' : `${formatDurationHM(progress.remainingMs)} remaining`} · {activeFast.method}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
                Ready when you are
              </AppText>
              <AppText variant="bodySmall" color={dashboardColors.textMuted} style={{ marginTop: 1 }}>
                Start a fast to begin your journey.
              </AppText>
            </>
          )}
        </View>
        {!activeFast ? (
          <Pressable
            onPress={goToFasting}
            accessibilityRole="button"
            accessibilityLabel="Start fast"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: dashboardColors.accent,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
              marginLeft: theme.spacing.xs,
            }}
          >
            <AppText variant="bodySmall" weight="700" color={dashboardColors.background}>
              Start Fast
            </AppText>
            <AppIcon name="arrow-forward" size={13} color={dashboardColors.background} />
          </Pressable>
        ) : null}
      </View>
    </HeroCard>
  );
});

FastingCard.displayName = 'FastingCard';
