import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppDateField } from '@/components/common/AppDateField';
import { AppIcon } from '@/components/common/AppIcon';
import { HeroChip } from '@/components/common/HeroChip';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { FASTING_METHODS, FastingMethodId } from '@/features/fasting/models';
import { fastingMethodName, fastingMethodShortExplanation } from '@/features/fasting/services/fastingPlanSchedule';
import { env } from '@/config/env';
import { MAX_PLANNED_HOURS } from '@/services/api/fastingApi';
import { SafetyNotice } from '@/features/fasting/components/SafetyNotice';
import { saveFastingScheduleThunk, startFastThunk } from '@/features/fasting/fastingSlice';
import { selectActiveFast, selectActiveSchedule, selectFastingActionStatus, selectFastingPlan } from '@/features/fasting/selectors';
import {
  FastingSchedule,
  MAX_CUSTOM_FASTING_HOURS,
  MIN_CUSTOM_FASTING_HOURS,
  ScheduleEditBlock,
  isDailyCycle,
  minutesSinceMidnight,
  planScheduleEdit,
  splitForEatingHours,
  splitForFastingHours,
  summarizeSchedule,
  validateSchedule,
} from '@/features/fasting/services/FastingSchedule';
import { formatClock, formatDayClock, formatHours, formatSpan } from '@/features/fasting/services/fastingFormat';
import { FastingHeroLayout } from './FastingHeroLayout';

type Category = 'intermittent' | 'longer' | 'individual';

type TFunction = ReturnType<typeof useTranslation>['t'];

const INTERMITTENT = FASTING_METHODS.filter((m) => m.category === 'intermittent');
// The API stores at most 48 planned hours (POST /fasting rejects more), so
// longer methods are only offered in the offline mock prototype.
const LONGER = FASTING_METHODS.filter((m) => m.category === 'longer' && (env.useMockApi || m.fastingHours <= MAX_PLANNED_HOURS));
const FASTING_GRADIENT = ['#9C7A3E', '#8A6A33'] as const;
const ACCENT = '#9C7A3E';

function blockReason(block: ScheduleEditBlock, t: TFunction): string {
  switch (block) {
    case 'no_fast_in_progress':
      return '';
    case 'would_start_in_future':
      return t('fasting.selectMethod.blockStartInFuture');
    case 'would_already_be_over':
      return t('fasting.selectMethod.blockAlreadyOver');
    case 'extended':
      return t('fasting.selectMethod.blockExtended');
  }
}

/**
 * Pulls a usable message out of a thunk rejection, whether it's a real `Error`/`ApiError`
 * (direct `dispatch` failures, synchronous throws) or the plain, serialized object RTK's
 * `.unwrap()` throws for an async thunk's rejection (see the call site for why that's the
 * normal case here). Returns null only when neither shape yields a non-empty string.
 */
function extractErrorMessage(err: unknown): string | null {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    const message = (err as { message: string }).message;
    return message.length > 0 ? message : null;
  }
  return null;
}

function dateForMinutes(minutes: number): Date {
  const d = new Date();
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Choose a fasting model and when fasting begins. Everything shown below the
 * pickers - when fasting begins, how long it lasts, when the eating window
 * opens and how long it is, and the next fasting phase - is derived live from
 * the model, the start time and the current local time (FastingSchedule).
 *
 * `mode: 'start'` begins fasting (or saves the schedule when the window isn't
 * open yet); `mode: 'edit'` changes the saved schedule, and - while a fast is
 * running - lets the user choose whether the change also re-plans that fast
 * or applies from the next cycle (see planScheduleEdit for the rule).
 */
export const SelectFastingMethodScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const route = useRoute<RouteProp<FastingStackParamList, 'SelectFastingMethod'>>();
  const dispatch = useAppDispatch();
  const mode = route.params?.mode ?? 'start';
  const plan = useAppSelector(selectFastingPlan);
  const savedSchedule = useAppSelector(selectActiveSchedule);
  const activeFast = useAppSelector(selectActiveFast);
  const actionStatus = useAppSelector(selectFastingActionStatus);
  const now = useNow(30_000);
  const categorySegments = useMemo(
    () => [
      { key: 'intermittent', label: t('fasting.selectMethod.intermittent') },
      { key: 'longer', label: t('fasting.selectMethod.longer') },
      { key: 'individual', label: t('fasting.selectMethod.custom') },
    ],
    [t]
  );

  // What the screen opens on: the running fast when editing one, else the saved schedule, else a sensible default.
  const initial = useMemo(() => {
    const runningSingle = mode === 'edit' && activeFast != null && (activeFast.eatingHours ?? 0) === 0;
    const category: Category = runningSingle
      ? 'longer'
      : plan?.method === 'individual'
        ? 'individual'
        : plan
          ? 'intermittent'
          : 'intermittent';
    const startMinutes = runningSingle
      ? minutesSinceMidnight(new Date(activeFast!.startTimestamp))
      : savedSchedule?.startMinutes ?? minutesSinceMidnight(new Date(Math.floor(Date.now() / 300_000) * 300_000));
    const methodId: FastingMethodId = runningSingle ? activeFast!.method : plan && plan.method !== 'individual' ? plan.method : '16:8';
    return { category, startMinutes, methodId, customFasting: plan?.method === 'individual' && savedSchedule ? savedSchedule.fastingHours : 16 };
    // Deliberately computed once: later store updates must not overwrite what the user is choosing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [category, setCategory] = useState<Category>(initial.category);
  const [intermittentId, setIntermittentId] = useState<FastingMethodId>(initial.category === 'intermittent' ? initial.methodId : '16:8');
  const [longerId, setLongerId] = useState<FastingMethodId>(initial.category === 'longer' ? initial.methodId : '24h');
  const [customFasting, setCustomFasting] = useState(initial.customFasting);
  const [startMinutes, setStartMinutes] = useState(initial.startMinutes);
  const startTouchedRef = useRef(false);
  const [applyTo, setApplyTo] = useState<'next' | 'current'>('next');
  const isSubmittingRef = useRef(false);
  /** Lets the Retry button on the error alert re-invoke the latest `confirm` without a stale-closure self-reference. */
  const confirmRef = useRef<() => void>(() => {});

  // A one-off longer fast has no daily anchor to inherit, so until the user picks a time it starts from now; the daily models go back to the saved schedule's time.
  useEffect(() => {
    if (mode !== 'start' || startTouchedRef.current) return;
    setStartMinutes(category === 'longer' ? minutesSinceMidnight(new Date()) : initial.startMinutes);
  }, [category, mode, initial.startMinutes]);

  const methodId: FastingMethodId = category === 'individual' ? 'individual' : category === 'longer' ? longerId : intermittentId;

  const schedule: FastingSchedule = useMemo(() => {
    if (category === 'individual') return { fastingHours: customFasting, eatingHours: 24 - customFasting, startMinutes };
    const method = FASTING_METHODS.find((m) => m.id === methodId)!;
    return { fastingHours: method.fastingHours, eatingHours: method.eatingHours, startMinutes };
  }, [category, customFasting, methodId, startMinutes]);

  const error = validateSchedule(schedule);
  const daily = isDailyCycle(schedule);
  const summary = useMemo(() => (error ? null : summarizeSchedule(schedule, now)), [error, schedule, now]);

  const runningWindow = activeFast
    ? { start: new Date(activeFast.startTimestamp), end: new Date(activeFast.plannedEndTimestamp), extensionCount: activeFast.extensionCount }
    : null;
  const editPlan = useMemo(
    () => (mode === 'edit' && !error ? planScheduleEdit({ now, current: runningWindow, next: schedule }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, error, now, schedule, activeFast]
  );

  // A single long fast has no "next cycle" to defer to, so editing it can only mean editing the fast itself.
  const editingSingleFast = mode === 'edit' && !daily;
  const effectiveApplyTo: 'next' | 'current' = editingSingleFast ? 'current' : editPlan?.canApplyToCurrent ? applyTo : 'next';
  const editBlockedNoFast = editingSingleFast && !activeFast;

  const stepFasting = useCallback((delta: number) => {
    setCustomFasting((current) => splitForFastingHours(current + delta)?.fastingHours ?? current);
  }, []);
  const stepEating = useCallback((delta: number) => {
    setCustomFasting((current) => splitForEatingHours(24 - current + delta)?.fastingHours ?? current);
  }, []);

  const confirm = useCallback(async () => {
    if (error || isSubmittingRef.current || editBlockedNoFast) return;
    isSubmittingRef.current = true;
    try {
      if (mode === 'edit') {
        await dispatch(saveFastingScheduleThunk({ methodId, schedule, applyToCurrent: effectiveApplyTo === 'current' && activeFast != null })).unwrap();
        navigation.goBack();
        return;
      }
      const { session, alreadyActive } = await dispatch(startFastThunk({ methodId, schedule })).unwrap();
      if (alreadyActive) navigation.replace('ActiveFast');
      else if (session) navigation.replace('FastingStarted');
      else {
        // The chosen start time hasn't happened yet (e.g. "fasting starts at 11:40 pm" and
        // it's currently morning) — FastingService deliberately only saves the schedule in
        // this case rather than starting a fast that hasn't begun. Silently going back here
        // previously left the user with no indication anything happened at all.
        Alert.alert(t('fasting.selectMethod.scheduleSavedTitle'), t('fasting.selectMethod.scheduleSavedMessage'));
        navigation.goBack();
      }
    } catch (err) {
      // Rejected - the slice already recorded the error; this just makes sure the user
      // actually sees it instead of the button silently going back to normal.
      //
      // `.unwrap()` on a createAsyncThunk rejection throws `action.error`, which Redux
      // Toolkit always runs through `miniSerializeError` first (RTK's default, since no
      // `serializeError` option is set below) — a plain `{ name, message, stack, code }`
      // object, never an actual `Error` instance. An `err instanceof Error` check here
      // was therefore always false, silently discarding the real ApiError message (the
      // specific reason — timeout, validation, expired session, ...) in favor of this
      // fallback on every single failure. Read `.message` directly instead.
      const message = extractErrorMessage(err) ?? t('fasting.selectMethod.genericStartError');
      Alert.alert(t('fasting.selectMethod.couldNotStartTitle'), message, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.retry'), onPress: () => confirmRef.current() },
      ]);
    } finally {
      isSubmittingRef.current = false;
    }
  }, [activeFast, dispatch, editBlockedNoFast, effectiveApplyTo, error, methodId, mode, navigation, schedule, t]);
  useEffect(() => {
    confirmRef.current = confirm;
  }, [confirm]);

  const startsNow = summary?.inProgress ?? false;
  const ctaLabel = mode === 'edit' ? t('common.saveChanges') : !daily ? t('fasting.selectMethod.startThisFast') : startsNow ? t('fasting.startFast') : t('fasting.selectMethod.saveSchedule');

  const headline = (() => {
    if (!summary) return null;
    if (mode === 'edit') {
      if (editBlockedNoFast) return t('fasting.selectMethod.editBlockedNoFast');
      if (!activeFast)
        return summary.nextFastingBegins || !daily ? t('fasting.selectMethod.appliesFromNextFast', { time: formatDayClock(summary.fastingBegins, now, t) }) : null;
      if (effectiveApplyTo === 'current' && editPlan?.currentIfApplied) {
        return t('fasting.selectMethod.currentFastWillBeginEnd', {
          start: formatDayClock(editPlan.currentIfApplied.start, now, t),
          end: formatDayClock(editPlan.currentIfApplied.fastEnd, now, t),
        });
      }
      const began = formatDayClock(new Date(activeFast.startTimestamp), now, t);
      return editPlan?.nextFastStart
        ? t('fasting.selectMethod.currentFastKeepsWindowNext', { began, next: formatDayClock(editPlan.nextFastStart, now, t) })
        : t('fasting.selectMethod.currentFastKeepsWindow', { began });
    }
    if (startsNow)
      return t('fasting.selectMethod.fastingWindowOpen', { span: formatSpan(now.getTime() - summary.fastingBegins.getTime(), t), time: formatClock(summary.fastingBegins) });
    return t('fasting.activeScreen.nextFastBeginsIn', { time: formatDayClock(summary.fastingBegins, now, t), span: formatSpan(summary.fastingBegins.getTime() - now.getTime(), t) });
  })();

  return (
    <FastingHeroLayout title={mode === 'edit' ? t('fasting.selectMethod.editScheduleTitle') : t('fasting.selectMethod.fastingScheduleTitle')} onBack={() => navigation.goBack()}>
      <FadeSlideIn delay={0}>
        <View style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl segments={categorySegments} selectedKey={category} onChange={(key) => setCategory(key as Category)} variant="hero" />
        </View>
      </FadeSlideIn>

      {category === 'intermittent' || category === 'longer' ? (
        <View style={{ marginBottom: theme.spacing.xs }}>
          {category === 'longer' ? (
            <View style={{ marginBottom: theme.spacing.sm }}>
              <SafetyNotice />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(category === 'intermittent' ? INTERMITTENT : LONGER).map((method) => (
              <View key={method.id} style={{ marginBottom: theme.spacing.xs }}>
                <HeroChip
                  label={fastingMethodName(method.id, t)}
                  selected={(category === 'intermittent' ? intermittentId : longerId) === method.id}
                  onPress={() => (category === 'intermittent' ? setIntermittentId(method.id) : setLongerId(method.id))}
                  activeColor={ACCENT}
                />
              </View>
            ))}
          </View>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.65)">
            {fastingMethodShortExplanation(methodId, t)}
          </AppText>
        </View>
      ) : null}

      {category === 'individual' ? (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.sm }}>
            {t('fasting.selectMethod.setYourOwnSplit')}
          </AppText>
          <Stepper label={t('fasting.selectMethod.fastingStepperLabel')} value={customFasting} min={MIN_CUSTOM_FASTING_HOURS} max={MAX_CUSTOM_FASTING_HOURS} onStep={stepFasting} />
          <Stepper label={t('fasting.selectMethod.eatingWindowStepperLabel')} value={24 - customFasting} min={1} max={24 - MIN_CUSTOM_FASTING_HOURS} onStep={stepEating} />
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginTop: theme.spacing.xxs }}>
            {t('fasting.selectMethod.cycleLabel', { fasting: customFasting, eating: 24 - customFasting })}
          </AppText>
        </View>
      ) : null}

      <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <AppDateField
          label={daily ? t('fasting.selectMethod.fastingStartsAt') : t('fasting.selectMethod.fastBeganAt')}
          mode="time"
          value={dateForMinutes(startMinutes)}
          onChange={(date) => {
            startTouchedRef.current = true;
            setStartMinutes(minutesSinceMidnight(date));
          }}
          variant="hero"
        />
        <Pressable
          onPress={() => {
            startTouchedRef.current = true;
            setStartMinutes(minutesSinceMidnight(new Date()));
          }}
          accessibilityRole="button"
          accessibilityLabel={t('fasting.selectMethod.useCurrentTimeLabel')}
          hitSlop={8}
          style={{ alignSelf: 'flex-start', paddingVertical: theme.spacing.xs }}
        >
          <AppText variant="bodySmall" color="#CBA05F">
            {t('fasting.selectMethod.useCurrentTime')}
          </AppText>
        </Pressable>
      </View>

      {summary ? (
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.14)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.sm,
          }}
        >
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
            {t('fasting.selectMethod.yourScheduleCardTitle')}
          </AppText>
          {daily ? (
            <>
              <SummaryRow label={t('fasting.selectMethod.fastingBegins')} value={formatDayClock(summary.fastingBegins, now, t)} />
              <SummaryRow label={t('fasting.selectMethod.fastingDuration')} value={formatHours(summary.fastingHours, t)} />
              <SummaryRow label={t('fasting.selectMethod.eatingWindowBegins')} value={formatDayClock(summary.eatingBegins, now, t)} />
              <SummaryRow label={t('fasting.selectMethod.eatingWindowRow')} value={formatHours(summary.eatingHours, t)} />
              <SummaryRow
                label={t('fasting.selectMethod.nextFastingPhase')}
                value={summary.nextFastingBegins ? formatDayClock(summary.nextFastingBegins, now, t) : '-'}
                last
              />
            </>
          ) : (
            <>
              <SummaryRow label={t('fasting.selectMethod.fastBegins')} value={formatDayClock(summary.fastingBegins, now, t)} />
              <SummaryRow label={t('fasting.selectMethod.fastLength')} value={formatHours(summary.fastingHours, t)} />
              <SummaryRow label={t('fasting.selectMethod.fastEnds')} value={formatDayClock(summary.eatingBegins, now, t)} last />
            </>
          )}
        </View>
      ) : (
        <AppText variant="bodySmall" color="#E5A093" style={{ marginBottom: theme.spacing.sm }}>
          {t('fasting.selectMethod.invalidSplit')}
        </AppText>
      )}

      {headline ? (
        <AppText variant="bodySmall" color="rgba(255,255,255,0.75)" style={{ marginBottom: theme.spacing.sm }}>
          {headline}
        </AppText>
      ) : null}

      {mode === 'edit' && activeFast && daily && editPlan ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="label" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.xxs }}>
            {t('fasting.selectMethod.applyChangeTo')}
          </AppText>
          <AppSegmentedControl
            segments={[
              { key: 'next', label: t('fasting.selectMethod.nextCycle') },
              { key: 'current', label: t('fasting.selectMethod.thisFastToo') },
            ]}
            selectedKey={effectiveApplyTo}
            onChange={(key) => {
              if (key === 'current' && !editPlan.canApplyToCurrent) return;
              setApplyTo(key as 'next' | 'current');
            }}
            variant="hero"
          />
          {editPlan.blockedBecause ? (
            <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginTop: theme.spacing.xxs }}>
              {blockReason(editPlan.blockedBecause, t)}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <AppGradientButton label={ctaLabel} onPress={confirm} loading={actionStatus === 'loading'} disabled={!!error || editBlockedNoFast} colors={FASTING_GRADIENT} />
    </FastingHeroLayout>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; last?: boolean }> = React.memo(({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="600" color="#FFFFFF">
        {value}
      </AppText>
    </View>
  );
});
SummaryRow.displayName = 'SummaryRow';

const Stepper: React.FC<{ label: string; value: number; min: number; max: number; onStep: (delta: number) => void }> = React.memo(({ label, value, min, max, onStep }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const button = (delta: number, icon: 'remove' | 'add', disabled: boolean) => (
    <Pressable
      onPress={() => onStep(delta)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={delta < 0 ? t('fasting.selectMethod.decreaseHours', { label: label.toLowerCase() }) : t('fasting.selectMethod.increaseHours', { label: label.toLowerCase() })}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.18)',
        opacity: disabled ? 0.35 : pressed ? 0.75 : 1,
      })}
    >
      <AppIcon name={icon} size={20} color="#FFFFFF" />
    </Pressable>
  );
  return (
    <View
      accessible
      accessibilityLabel={t('fasting.selectMethod.stepperValueLabel', { label, value })}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
      }}
    >
      <AppText variant="bodyMedium" color="#FFFFFF">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {button(-1, 'remove', value <= min)}
        <AppText variant="headingMedium" color="#FFFFFF" align="center" style={{ minWidth: 72 }}>
          {t('fasting.selectMethod.hoursValue', { value })}
        </AppText>
        {button(1, 'add', value >= max)}
      </View>
    </View>
  );
});
Stepper.displayName = 'Stepper';
