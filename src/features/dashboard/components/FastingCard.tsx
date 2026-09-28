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
import { useFastingCycle } from '@/features/fasting/hooks/useFastingCycle';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { sessionModelLabel } from '@/features/fasting/services/fastingPlanSchedule';
import { formatDayClock, formatSpan } from '@/features/fasting/services/fastingFormat';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { dashboardColors, dashboardCardElevated } from '../dashboardTheme';

/** Fasting's own warm bronze accent (matches `theme.colors.fasting`) — this card is the one place on the otherwise-neutral Home dashboard that should read as "fasting," not the dashboard's generic steel accent. */
const FASTING_ACCENT = '#8B7FA8';

export const FastingCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { state, activeFast, now } = useFastingCycle({ settle: true });
  const isEating = state.phase === 'eating';
  const isRunning = state.phase !== 'idle';
  // Eases toward each new tick rather than snapping — reads as the ring
  // "filling" on mount and gliding forward each second instead of a
  // robotic per-second jump.
  const animatedProgress = useAnimatedProgress(isRunning ? Math.min(state.progress, 1) : 0);
  const goToFasting = () => navigation.navigate('FastingTab', { screen: 'FastingHome' });

  return (
    <HeroCard onPress={goToFasting} style={[dashboardCardElevated, { marginBottom: theme.spacing.sm }]} scaleOnPress>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppProgressRing progress={animatedProgress} size={72} strokeWidth={7} color={FASTING_ACCENT} trackColor={dashboardColors.border}>
          <AppIcon name="timer-outline" size={22} color={FASTING_ACCENT} />
        </AppProgressRing>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <AppText variant="label" color={FASTING_ACCENT} style={{ letterSpacing: 0.5 }}>
              FASTING
            </AppText>
            {isRunning ? (
              <FadeSlideIn delay={250} fromY={4}>
                <View style={{ marginLeft: theme.spacing.xxs }}>
                  <AppBadge label={isEating ? 'Eating window' : 'Active'} tone="success" />
                </View>
              </FadeSlideIn>
            ) : null}
          </View>
          {isRunning ? (
            <>
              <AppText variant="metricMedium" color={dashboardColors.textPrimary}>
                {isEating ? formatSpan(state.remainingMs) : formatDurationHM(state.elapsedMs)}
              </AppText>
              <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                {isEating
                  ? `until fasting begins ${state.nextFastStart ? formatDayClock(state.nextFastStart, now) : ''}`
                  : state.goalReached
                    ? 'Goal time reached'
                    : `${formatSpan(state.remainingMs)} left${state.nextTransition?.kind === 'eating_begins' ? ` · eating ${formatDayClock(state.nextTransition.at, now)}` : ''}`}
                {activeFast ? ` · ${sessionModelLabel(activeFast)}` : ''}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
                {state.nextFastStart ? 'Next fast' : 'Ready when you are'}
              </AppText>
              <AppText variant="bodySmall" color={dashboardColors.textMuted} style={{ marginTop: 1 }}>
                {state.nextFastStart ? `Begins ${formatDayClock(state.nextFastStart, now)}` : 'Start a fast to begin your journey.'}
              </AppText>
            </>
          )}
        </View>
        {!isRunning ? (
          <Pressable
            onPress={goToFasting}
            accessibilityRole="button"
            accessibilityLabel="Start fast"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: FASTING_ACCENT,
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
