import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppCard } from '@/components/common/AppCard';
import { AppButton } from '@/components/common/AppButton';
import { AppBadge } from '@/components/common/AppBadge';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { fastingRepository } from '@/features/fasting/repository/MockFastingRepository';
import { FastingPlan, FastingPlanDayOverride } from '@/features/fasting/models';
import { scheduleFromPlan, formatModelLabel } from '@/features/fasting/services/fastingPlanSchedule';
import { selectCurrentUserId } from '@/features/auth/selectors';
import { useAppSelector } from '@/store/hooks';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UPCOMING_DAYS = 14;

/** The local calendar date (yyyy-mm-dd). `toISOString()` would give the UTC date, which is the previous day for a local midnight east of UTC. */
function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Lists saved recurring fasting plans and lets the user skip an individual
 * upcoming occurrence — stored as a separate FastingPlanDayOverride record,
 * so the underlying recurring plan is never rewritten by a one-off change.
 */
export const FastingPlansScreen: React.FC = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const [plans, setPlans] = useState<FastingPlan[] | null>(null);
  const [overridesByPlan, setOverridesByPlan] = useState<Record<string, FastingPlanDayOverride[]>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const loadedPlans = await fastingRepository.getPlans(currentUserId);
    setPlans(loadedPlans);
    const overridesEntries = await Promise.all(loadedPlans.map((p) => fastingRepository.getPlanOverrides(p.id)));
    const map: Record<string, FastingPlanDayOverride[]> = {};
    loadedPlans.forEach((p, idx) => {
      map[p.id] = overridesEntries[idx];
    });
    setOverridesByPlan(map);
  }, [currentUserId]);

  // Reload on focus: the schedule editor saves a plan and comes back here.
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const toggleSkip = useCallback(
    async (plan: FastingPlan, dateKey: string, currentlySkipped: boolean) => {
      const busyId = `${plan.id}_${dateKey}`;
      setBusyKey(busyId);
      if (currentlySkipped) {
        await fastingRepository.removePlanDayOverride(plan.id, dateKey);
      } else {
        await fastingRepository.setPlanDayOverride({ planId: plan.id, userId: currentUserId, date: dateKey, action: 'skip' });
      }
      await loadAll();
      setBusyKey(null);
    },
    [currentUserId, loadAll]
  );

  if (!plans) return null;

  return (
    <>
      <AppHeader title="My fasting plans" onBack={() => navigation.goBack()} />
      <AppScreen belowHeader>
        {plans.length === 0 ? (
          <AppEmptyState
            icon="calendar-outline"
            title="No recurring plans yet"
            message="Choose a fasting model and when it begins - it repeats every day."
            actionLabel="Set up a schedule"
            onAction={() => navigation.navigate('SelectFastingMethod', { mode: 'edit' })}
          />
        ) : (
          <>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
              Tap an upcoming day to skip it just for that occurrence — the rest of the recurring plan stays
              unchanged.
            </AppText>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} overrides={overridesByPlan[plan.id] ?? []} onToggleSkip={toggleSkip} busyKey={busyKey} />
            ))}
          </>
        )}
        <AppButton label="Change schedule" variant="outline" onPress={() => navigation.navigate('SelectFastingMethod', { mode: 'edit' })} style={{ marginTop: theme.spacing.sm }} />
      </AppScreen>
    </>
  );
};

const PlanCard: React.FC<{
  plan: FastingPlan;
  overrides: FastingPlanDayOverride[];
  busyKey: string | null;
  onToggleSkip: (plan: FastingPlan, dateKey: string, currentlySkipped: boolean) => void;
}> = ({ plan, overrides, busyKey, onToggleSkip }) => {
  const { theme } = useTheme();
  const skippedDates = useMemo(() => new Set(overrides.filter((o) => o.action === 'skip').map((o) => o.date)), [overrides]);

  const schedule = useMemo(() => scheduleFromPlan(plan), [plan]);

  const upcoming = useMemo(() => {
    const days: Date[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < UPCOMING_DAYS && days.length < 7; i++) {
      const d = new Date(cursor);
      d.setDate(d.getDate() + i);
      if (plan.weekdays.includes(d.getDay())) days.push(d);
    }
    return days;
  }, [plan.weekdays]);

  return (
    <AppCard style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
        <AppText variant="headingSmall">
          {schedule ? `${formatModelLabel({ method: plan.method, fastingHours: schedule.fastingHours, eatingHours: schedule.eatingHours })} · ${plan.startTime}–${plan.endTime}` : plan.method}
        </AppText>
        <AppBadge label={plan.active ? 'Active' : 'Paused'} tone={plan.active ? 'success' : 'neutral'} />
      </View>
      <AppText variant="caption" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.sm }}>
        {plan.weekdays.map((d) => WEEKDAY_LABELS[d]).join(', ')}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {upcoming.map((day) => {
          const key = toDateKey(day);
          const skipped = skippedDates.has(key);
          const busy = busyKey === `${plan.id}_${key}`;
          return (
            <AppBadge
              key={key}
              label={`${day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}${skipped ? ' · skipped' : ''}${busy ? '…' : ''}`}
              tone={skipped ? 'warning' : 'neutral'}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.xs }}>
        {upcoming.map((day) => {
          const key = toDateKey(day);
          const skipped = skippedDates.has(key);
          return (
            <AppButton
              key={key}
              label={`${skipped ? 'Unskip' : 'Skip'} ${day.toLocaleDateString(undefined, { weekday: 'short' })}`}
              variant={skipped ? 'outline' : 'ghost'}
              fullWidth={false}
              onPress={() => onToggleSkip(plan, key, skipped)}
              style={{ marginRight: theme.spacing.xxs, marginBottom: theme.spacing.xxs, height: 32, paddingHorizontal: theme.spacing.sm }}
            />
          );
        })}
      </View>
    </AppCard>
  );
};
