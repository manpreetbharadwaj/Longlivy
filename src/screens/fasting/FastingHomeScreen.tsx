import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { HeroCard } from '@/components/common/HeroCard';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { selectFastingPlan, selectFastingStats, selectFastingStatus } from '@/features/fasting/selectors';
import { useFastingCycle } from '@/features/fasting/hooks/useFastingCycle';
import { FastingPlan } from '@/features/fasting/models';
import { FastingSchedule } from '@/features/fasting/services/FastingSchedule';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { formatModelLabel, sessionModelLabel } from '@/features/fasting/services/fastingPlanSchedule';
import { formatClock, formatDayClock, formatSpan } from '@/features/fasting/services/fastingFormat';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';
import { pillarGradients } from '@/theme/gradients';
import { FastingHeroLayout } from './FastingHeroLayout';

// Fasting's own identity color — muted violet — rather than the generic
// dashboard blue accent, so landing on this tab reads as "fasting" the
// moment the ring/CTA render, not just once the atmosphere gradient behind
// them is noticed.
const FASTING_ACCENT = '#8B7FA8';
const EATING_ACCENT = '#7FA88B';

export const FastingHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectFastingStatus);
  const stats = useAppSelector(selectFastingStats);
  const plan = useAppSelector(selectFastingPlan);
  const { state, schedule, activeFast, now } = useFastingCycle({ settle: true });
  const isRunning = state.phase !== 'idle';
  const accent = state.phase === 'eating' ? EATING_ACCENT : FASTING_ACCENT;

  // `loadFastingData` keeps re-firing on every mount (tab refocus included) so the
  // screen never shows stale data, but re-showing the full-screen loader for that
  // background refresh — rather than just for the very first load — replaced the
  // already-rendered content with a blank loading state on every return visit, which
  // is the "refresh indicator briefly appears and disappears" flicker: not a hung
  // request, a loader firing for reloads that didn't need one.
  useEffect(() => {
    dispatch(loadFastingData());
  }, [dispatch]);
  // Derived from `status`, adjusted during render rather than in an effect (React's own
  // recommended pattern for "remember something from a previous render") so marking it
  // true doesn't cost an extra effect-triggered render cycle.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === 'succeeded' || status === 'failed') setHasLoadedOnce(true);
  }

  return (
    <FastingHeroLayout title={t('fasting.title')}>
      {status === 'loading' && !activeFast && !hasLoadedOnce ? (
        <AppLoader label={t('common.loading')} />
      ) : (
        <>
          {isRunning ? (
            <HeroCard onPress={() => navigation.navigate('ActiveFast')} style={[dashboardCardStyle, { alignItems: 'center', marginBottom: theme.spacing.md }]} scaleOnPress>
              <AppProgressRing progress={state.progress} size={180} strokeWidth={12} color={accent} trackColor={dashboardColors.border} glow>
                <AppText variant="label" color={accent} style={{ letterSpacing: 1.2 }}>
                  {state.phase === 'eating' ? 'EATING' : state.goalReached ? 'GOAL REACHED' : 'FASTING'}
                </AppText>
                <AppText variant="metricLarge" color={dashboardColors.textPrimary}>
                  {Math.round(Math.min(state.progress, 1) * 100)}%
                </AppText>
                {schedule || activeFast ? (
                  <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                    {activeFast
                      ? sessionModelLabel(activeFast)
                      : formatModelLabel({ method: plan?.method ?? 'individual', fastingHours: schedule?.fastingHours ?? 0, eatingHours: schedule?.eatingHours ?? 0 })}
                  </AppText>
                ) : null}
              </AppProgressRing>
              <AppText variant="bodyMedium" color={dashboardColors.textPrimary} style={{ marginTop: theme.spacing.sm }} align="center">
                {state.nextTransition
                  ? `${state.nextTransition.kind === 'eating_begins' ? 'Eating window begins' : state.nextTransition.kind === 'fasting_begins' ? 'Fasting begins' : 'Goal reached'} ${formatDayClock(state.nextTransition.at, now)}`
                  : t('fasting.elapsed', { duration: formatDurationHM(state.elapsedMs) })}
              </AppText>
              <AppText variant="bodySmall" color={dashboardColors.textMuted} align="center" style={{ marginTop: 2 }}>
                {state.nextTransition ? `in ${formatSpan(state.remainingMs)}` : ''}
              </AppText>
              <Pressable
                onPress={() => navigation.navigate('ActiveFast')}
                accessibilityRole="button"
                accessibilityLabel={state.phase === 'eating' ? 'View eating window' : t('fasting.viewActiveFast')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: accent,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: 10,
                  borderRadius: theme.radius.pill,
                  marginTop: theme.spacing.sm,
                }}
              >
                <AppText variant="bodyMedium" weight="700" color={dashboardColors.background}>
                  {state.phase === 'eating' ? 'View eating window' : t('fasting.viewActiveFast')}
                </AppText>
              </Pressable>
              {state.phase === 'eating' ? (
                <Pressable
                  onPress={() => navigation.navigate('SelectFastingMethod', { mode: 'start' })}
                  accessibilityRole="button"
                  accessibilityLabel="Start your next fast early"
                  hitSlop={8}
                  style={{ paddingVertical: theme.spacing.sm }}
                >
                  <AppText variant="bodySmall" color={dashboardColors.textSecondary}>
                    Start next fast early
                  </AppText>
                </Pressable>
              ) : null}
            </HeroCard>
          ) : (
            <IdleFastHero
              nextFastStart={state.nextFastStart}
              now={now}
              schedule={schedule}
              plan={plan}
              onStart={() => navigation.navigate('SelectFastingMethod', { mode: 'start' })}
            />
          )}

          {schedule && plan ? (
            <Pressable
              onPress={() => navigation.navigate('SelectFastingMethod', { mode: 'edit' })}
              accessibilityRole="button"
              accessibilityLabel="Edit fasting schedule"
              style={({ pressed }) => [dashboardCardStyle, { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, marginBottom: theme.spacing.md, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color={dashboardColors.textMuted}>
                  Your schedule
                </AppText>
                <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary}>
                  {formatModelLabel({ method: plan.method, fastingHours: schedule.fastingHours, eatingHours: schedule.eatingHours })} · fasting from {formatClock(new Date(2000, 0, 1, 0, schedule.startMinutes))}
                </AppText>
                <AppText variant="bodySmall" color={dashboardColors.textSecondary}>
                  Eating window opens {formatClock(new Date(2000, 0, 1, 0, schedule.startMinutes + schedule.fastingHours * 60))}
                </AppText>
              </View>
              <AppText variant="bodySmall" weight="700" color={FASTING_ACCENT}>
                Edit
              </AppText>
            </Pressable>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
            <StatTile index={0} label={t('fasting.stats.currentStreak')} value={`${stats.currentStreak}${t('units.daysShort')}`} />
            <StatTile index={1} label={t('fasting.stats.completed')} value={`${stats.completedSessions}`} />
            <StatTile index={2} label={t('fasting.stats.avgDuration')} value={formatDurationHM(stats.averageDurationMs)} />
            <StatTile index={3} label={t('fasting.stats.longest')} value={formatDurationHM(stats.longestDurationMs)} />
          </View>

          <View style={{ marginTop: theme.spacing.md }}>
            <ListRow index={0} icon="time-outline" label={t('fasting.menu.history')} onPress={() => navigation.navigate('FastingHistory')} />
            <ListRow index={1} icon="calendar-outline" label={t('fasting.menu.calendar')} onPress={() => navigation.navigate('FastingCalendar')} />
            <ListRow index={2} icon="stats-chart-outline" label={t('fasting.menu.statistics')} onPress={() => navigation.navigate('FastingStatistics')} />
            <ListRow index={3} icon="document-text-outline" label={t('fasting.menu.plans')} onPress={() => navigation.navigate('FastingPlans')} />
            <ListRow index={4} icon="settings-outline" label={t('fasting.menu.settings')} onPress={() => navigation.navigate('FastingSettings')} isLast />
          </View>
        </>
      )}
    </FastingHeroLayout>
  );
};

interface IdleFastHeroProps {
  nextFastStart: Date | null;
  now: Date;
  schedule: FastingSchedule | null;
  plan: FastingPlan | null;
  onStart: () => void;
}

const IdleFastHero: React.FC<IdleFastHeroProps> = React.memo(({ nextFastStart, now, schedule, plan, onStart }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const hasSchedule = Boolean(schedule && plan);
  const protocolLabel = hasSchedule && schedule && plan
    ? formatModelLabel({ method: plan.method, fastingHours: schedule.fastingHours, eatingHours: schedule.eatingHours })
    : null;

  return (
    <HeroCard style={[dashboardCardStyle, { padding: 0, overflow: 'hidden', marginBottom: theme.spacing.md }]}>
      <LinearGradient
        colors={pillarGradients.fasting}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: theme.spacing.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color="rgba(255,255,255,0.72)" style={{ letterSpacing: 1.4 }}>
              {hasSchedule ? 'UP NEXT' : 'FASTING MODE'}
            </AppText>
            <AppText variant="headingLarge" color="#FFFFFF" style={{ marginTop: 2 }}>
              {nextFastStart ? 'Next fast' : t('fasting.noActiveFast')}
            </AppText>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="timer-outline" size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.lg }}>
          <AppProgressRing progress={0} size={132} strokeWidth={10} color="#E5DDF4" trackColor="rgba(255,255,255,0.18)" glow icon="timer-outline" iconSize={34} iconColor="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            {nextFastStart ? (
              <>
                <AppText variant="label" color="rgba(255,255,255,0.72)">
                  Scheduled start
                </AppText>
                <AppText variant="headingMedium" color="#FFFFFF" style={{ marginTop: 3 }}>
                  {formatDayClock(nextFastStart, now)}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
                  <AppIcon name="time-outline" size={15} color="#E5DDF4" />
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.82)" style={{ marginLeft: 5 }}>
                    Starts in {formatSpan(nextFastStart.getTime() - now.getTime())}
                  </AppText>
                </View>
              </>
            ) : (
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.82)">
                {t('fasting.noActiveFastBody')}
              </AppText>
            )}
          </View>
        </View>

        {hasSchedule && schedule && protocolLabel ? (
          <View style={{ marginTop: theme.spacing.lg, padding: theme.spacing.sm, borderRadius: theme.radius.md, backgroundColor: 'rgba(0,0,0,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }}>
            <AppText variant="caption" color="rgba(255,255,255,0.68)" style={{ letterSpacing: 1.2 }}>
              YOUR PROTOCOL
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
              <AppText variant="bodyLarge" weight="700" color="#FFFFFF">
                {protocolLabel}
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.82)">
                Starts {formatClock(new Date(2000, 0, 1, 0, schedule.startMinutes))}
              </AppText>
            </View>
            <AppText variant="caption" color="rgba(255,255,255,0.68)" style={{ marginTop: 2 }}>
              {schedule.eatingHours > 0 ? `${schedule.fastingHours}h fasting · ${schedule.eatingHours}h eating window` : `${schedule.fastingHours}h single fast`}
            </AppText>
          </View>
        ) : null}

        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel={t('fasting.startFast')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? '#D4C9EB' : '#E5DDF4',
            minHeight: 52,
            borderRadius: theme.radius.lg,
            marginTop: theme.spacing.lg,
          })}
        >
          <AppIcon name="play" size={17} color={FASTING_ACCENT} />
          <AppText variant="headingSmall" color="#4B3E63" style={{ marginLeft: 8 }}>
            {t('fasting.startFast')}
          </AppText>
        </Pressable>
      </LinearGradient>
    </HeroCard>
  );
});
IdleFastHero.displayName = 'IdleFastHero';

const StatTile: React.FC<{ index: number; label: string; value: string }> = React.memo(({ index, label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
        <View style={[dashboardCardStyle, { padding: theme.spacing.sm }]}>
          <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
            {value}
          </AppText>
          <AppText variant="caption" color={dashboardColors.textMuted}>
            {label}
          </AppText>
        </View>
      </FadeSlideIn>
    </View>
  );
});
StatTile.displayName = 'StatTile';

const ListRow: React.FC<{ index: number; icon: AppIconName; label: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, label, onPress, isLast }) => {
    const { theme } = useTheme();
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            dashboardCardStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.sm,
              marginBottom: isLast ? 0 : theme.spacing.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: dashboardColors.surfaceSecondary,
              borderWidth: 1,
              borderColor: dashboardColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <AppIcon name={icon} size={18} color={FASTING_ACCENT} />
          </View>
          <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary} style={{ flex: 1 }}>
            {label}
          </AppText>
          <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
        </Pressable>
      </FadeSlideIn>
    );
  }
);
ListRow.displayName = 'ListRow';
