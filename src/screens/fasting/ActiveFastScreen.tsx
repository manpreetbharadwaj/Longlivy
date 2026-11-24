import React, { useCallback, useState, useEffect } from 'react';
import { Alert, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { ctaGradient } from '@/theme/gradients';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectFastingPlan } from '@/features/fasting/selectors';
import { useFastingCycle } from '@/features/fasting/hooks/useFastingCycle';
import { formatDurationHMS, calculateEnergySourceMix } from '@/features/fasting/services/FastingCalculator';
import { isMultiDayFast } from '@/features/fasting/services/FastingSchedule';
import { formatModelLabel, sessionModelLabel } from '@/features/fasting/services/fastingPlanSchedule';
import { formatDayClock, formatSpan } from '@/features/fasting/services/fastingFormat';
import { endFastThunk, extendFastThunk } from '@/features/fasting/fastingSlice';
import { FastingTimeline } from '@/features/fasting/components/FastingTimeline';
import { AutophagyInfoCard } from '@/features/fasting/components/AutophagyInfoCard';
import { EnergySourceVisualization } from '@/features/fasting/components/EnergySourceVisualization';
import { LiveMomentCard, MILESTONE_THRESHOLDS } from '@/features/fasting/components/LiveMomentCard';
import { TIMELINE_PHASES } from '@/features/fasting/fastingTimelineContent';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { FastingHeroLayout } from './FastingHeroLayout';

const HOUR = 3_600_000;
const EATING_COLOR = '#7FA88B';

function currentPhaseColor(elapsedHours: number): string {
  for (let i = TIMELINE_PHASES.length - 1; i >= 0; i--) {
    if (elapsedHours >= TIMELINE_PHASES[i].milestones[0].hours) return TIMELINE_PHASES[i].color;
  }
  return TIMELINE_PHASES[0].color;
}

export const ActiveFastScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const plan = useAppSelector(selectFastingPlan);
  const { state, schedule, activeFast, now } = useFastingCycle({ settle: true });
  const [showExtend, setShowExtend] = useState(false);
  const [extendHours, setExtendHours] = useState('2');
  const { preferences } = useAppPreferences();
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<number>>(new Set());

  // A new fast (or reopening the screen for a different session) starts with a clean milestone queue.
  useEffect(() => {
    setDismissedMilestones(new Set());
  }, [activeFast?.id]);

  const isFasting = state.phase === 'fasting';
  const activeMilestone = isFasting && preferences.liveMomentsEnabled
    ? MILESTONE_THRESHOLDS.find((m) => state.progress >= m && !dismissedMilestones.has(m))
    : undefined;

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const reachedPlannedEnd = activeFast ? Date.now() >= new Date(activeFast.plannedEndTimestamp).getTime() : false;

  const handleEnd = useCallback(async () => {
    // Deliberately does NOT close the dialog first — it stays open with its confirm
    // button showing a spinner (ConfirmDialog's `confirmLoading`) for the whole
    // request, so the session the user is about to end stays visible and there's no
    // gap where the dialog has vanished but nothing yet indicates a request is in
    // flight. The dialog only closes once the request actually settles, below.
    if (!activeFast || ending) return;
    setEnding(true);
    const result = await dispatch(endFastThunk(activeFast));
    setEnding(false);
    setConfirmEnd(false);
    if (endFastThunk.fulfilled.match(result)) {
      // The backend has confirmed the session is saved — only now is it safe to say so.
      Alert.alert(t('fasting.activeScreen.savedTitle'), t('fasting.activeScreen.savedMessage'), [
        { text: t('common.ok'), onPress: () => navigation.replace('FastSummary', { sessionId: result.payload.id }) },
      ]);
    } else {
      // Rejected via the `.fulfilled.match()` pattern, not `.unwrap()` — `result.error` is
      // already the plain object `createAsyncThunk` always produces, and `.message` on it
      // is read directly here (no `instanceof Error` check to trip over, unlike the bug
      // fixed in SelectFastingMethodScreen's catch block for the same class of error).
      // The active session itself was never touched locally, so it's still exactly as it
      // was before the attempt — nothing to roll back.
      Alert.alert(t('fasting.activeScreen.notEndedTitle'), result.error.message ?? t('fasting.activeScreen.tryAgain'));
    }
  }, [activeFast, dispatch, ending, navigation, t]);

  const handleExtend = useCallback(async () => {
    if (!activeFast) return;
    await dispatch(
      extendFastThunk({ sessionId: activeFast.id, additionalHours: Number(extendHours) || 1, currentPlannedEnd: activeFast.plannedEndTimestamp })
    );
    setShowExtend(false);
  }, [activeFast, dispatch, extendHours]);

  const editSchedule = useCallback(() => navigation.navigate('SelectFastingMethod', { mode: 'edit' }), [navigation]);
  const startFast = useCallback(() => navigation.navigate('SelectFastingMethod', { mode: 'start' }), [navigation]);

  if (state.phase === 'idle') {
    return (
      <FastingHeroLayout title={schedule ? t('fasting.activeScreen.yourSchedule') : t('fasting.activeScreen.title')} onBack={() => navigation.goBack()} scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg }}>
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
            <AppIcon name="timer-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {state.nextFastStart ? t('fasting.activeScreen.noFastRunning') : t('fasting.noActiveFast')}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
            {state.nextFastStart
              ? t('fasting.activeScreen.nextFastBeginsIn', { time: formatDayClock(state.nextFastStart, now, t), span: formatSpan(state.nextFastStart.getTime() - now.getTime(), t) })
              : t('fasting.activeScreen.startFromHome')}
          </AppText>
          <View style={{ alignSelf: 'stretch' }}>
            <AppGradientButton label={t('fasting.activeScreen.startAFast')} onPress={startFast} colors={ctaGradient} />
            {schedule ? <GhostButton label={t('fasting.activeScreen.editSchedule')} onPress={editSchedule} /> : null}
          </View>
        </View>
      </FastingHeroLayout>
    );
  }

  const fastingHours = state.fastStart && state.fastEnd ? (state.fastEnd.getTime() - state.fastStart.getTime()) / HOUR : 0;
  const fastingElapsedHours = isFasting ? state.elapsedMs / HOUR : fastingHours;
  const daily = state.eatingStart != null;
  const modelLabel = activeFast
    ? sessionModelLabel(activeFast, t)
    : schedule && plan
      ? formatModelLabel({ method: plan.method, fastingHours: schedule.fastingHours, eatingHours: schedule.eatingHours }, t)
      : formatModelLabel({ method: 'individual', fastingHours: Math.round(fastingHours), eatingHours: 8 }, t);

  const ringColor = isFasting ? currentPhaseColor(fastingElapsedHours) : EATING_COLOR;
  const phaseLabel = (isFasting ? (state.goalReached ? t('fasting.activeScreen.goalReached') : t('fasting.activeScreen.fasting')) : t('fasting.activeScreen.eatingWindow')).toUpperCase();
  const countdownMs = state.goalReached ? state.elapsedMs : Math.max(state.remainingMs, 0);
  const countdownCaption = state.goalReached
    ? t('fasting.activeScreen.fastingTimeCaption')
    : isFasting
      ? daily
        ? t('fasting.activeScreen.untilEatingWindowBegins')
        : t('fasting.activeScreen.untilYourGoal')
      : t('fasting.activeScreen.untilFastingBegins');
  const transition = state.nextTransition;
  const transitionLabel = (kind: 'eating_begins' | 'fasting_begins' | 'goal_reached') => {
    switch (kind) {
      case 'eating_begins':
        return t('fasting.activeScreen.eatingWindowBeginsTransition');
      case 'fasting_begins':
        return t('fasting.activeScreen.fastingBeginsTransition');
      case 'goal_reached':
        return t('fasting.activeScreen.goalReachedTransition');
    }
  };

  return (
    <FastingHeroLayout title={isFasting ? t('fasting.activeScreen.modelFastTitle', { model: modelLabel }) : t('fasting.activeScreen.eatingWindow')} onBack={() => navigation.goBack()}>
      {activeMilestone ? (
        <LiveMomentCard milestone={activeMilestone} onDismiss={() => setDismissedMilestones((prev) => new Set(prev).add(activeMilestone))} />
      ) : null}

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppProgressRing progress={state.progress} size={240} strokeWidth={18} color={ringColor} trackColor="rgba(255,255,255,0.12)" glow>
          <AppText variant="label" color={ringColor} style={{ letterSpacing: 1.2 }}>
            {phaseLabel}
          </AppText>
          <AppText variant="metricLarge" color="#FFFFFF" style={{ marginTop: 2 }} accessibilityLabel={`${phaseLabel}, ${formatSpan(countdownMs, t)} ${countdownCaption}`}>
            {formatDurationHMS(countdownMs)}
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" align="center" style={{ paddingHorizontal: theme.spacing.md }}>
            {countdownCaption}
          </AppText>
          {isFasting && isMultiDayFast(fastingHours) ? (
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>
              {t('fasting.activeScreen.dayCounter', { day: Math.max(1, Math.ceil(state.elapsedMs / (24 * HOUR))) })}
            </AppText>
          ) : null}
        </AppProgressRing>

        {transition ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: theme.spacing.md,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.pill,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
            }}
          >
            <AppIcon name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            <AppText variant="bodyMedium" color="#FFFFFF" style={{ marginLeft: 6 }}>
              {transitionLabel(transition.kind)} · {formatDayClock(transition.at, now, t)}
            </AppText>
          </View>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.14)',
          borderRadius: theme.radius.lg,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        {isFasting ? <Row label={t('fasting.activeScreen.elapsed')} value={formatSpan(state.elapsedMs, t)} /> : null}
        {daily && state.fastStart && state.fastEnd && state.eatingStart && state.eatingEnd ? (
          <>
            <Row label={t('fasting.activeScreen.fastingBeginsRow')} value={formatDayClock(state.fastStart, now, t)} />
            <Row label={t('fasting.activeScreen.fastingDuration')} value={formatSpan(state.fastEnd.getTime() - state.fastStart.getTime(), t)} />
            <Row label={t('fasting.activeScreen.eatingWindowBeginsRow')} value={formatDayClock(state.eatingStart, now, t)} />
            <Row label={t('fasting.activeScreen.eatingWindowDuration')} value={formatSpan(state.eatingEnd.getTime() - state.eatingStart.getTime(), t)} />
            <Row
              label={t('fasting.activeScreen.nextFastingPhase')}
              value={state.nextFastStart ? formatDayClock(state.nextFastStart, now, t) : '-'}
              last={!activeFast || activeFast.extensionCount === 0}
            />
          </>
        ) : state.fastStart && state.fastEnd ? (
          <>
            <Row label={t('fasting.summary.started')} value={formatDayClock(state.fastStart, now, t)} />
            <Row label={t('fasting.activeScreen.fastLength')} value={formatSpan(state.fastEnd.getTime() - state.fastStart.getTime(), t)} />
            <Row label={t('fasting.activeScreen.plannedEndRow')} value={formatDayClock(state.fastEnd, now, t)} last={!activeFast || activeFast.extensionCount === 0} />
          </>
        ) : null}
        {activeFast && activeFast.extensionCount > 0 ? <Row label={t('fasting.activeScreen.extensions')} value={`${activeFast.extensionCount}`} last /> : null}
      </View>

      {activeFast && showExtend ? (
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.14)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
            {t('fasting.activeScreen.extendThisFast')}
          </AppText>
          <HeroTextField label={t('fasting.activeScreen.additionalHours')} value={extendHours} onChangeText={setExtendHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
          <AppGradientButton label={t('fasting.activeScreen.confirmExtension')} onPress={handleExtend} />
          <GhostButton label={t('common.cancel')} onPress={() => setShowExtend(false)} />
        </View>
      ) : (
        <View style={{ marginBottom: theme.spacing.md }}>
          {activeFast ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <OutlineButton label={t('fasting.activeScreen.extend')} onPress={() => setShowExtend(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppGradientButton label={t('fasting.activeScreen.endFast')} onPress={() => setConfirmEnd(true)} loading={ending} disabled={ending} colors={['#DD7A68', '#C4463A']} />
              </View>
            </View>
          ) : null}
          <OutlineButton label={t('fasting.activeScreen.editSchedule')} onPress={editSchedule} style={{ marginTop: activeFast ? theme.spacing.sm : 0 }} />
        </View>
      )}

      {isFasting ? (
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.14)',
            borderRadius: theme.radius.lg,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
          }}
        >
          <EnergySourceVisualization mix={calculateEnergySourceMix(fastingElapsedHours)} />
        </View>
      ) : null}

      {isFasting ? (
        <>
          <View style={{ marginBottom: theme.spacing.md }}>
            <AutophagyInfoCard />
          </View>
          <FastingTimeline elapsedHours={fastingElapsedHours} maxHours={Math.max(fastingHours, 1)} />
        </>
      ) : null}
      <ConfirmDialog
        visible={confirmEnd}
        title={t('fasting.activeScreen.endThisFastTitle')}
        message={reachedPlannedEnd ? t('fasting.activeScreen.endConfirmReached') : t('fasting.activeScreen.endConfirmNotReached')}
        confirmLabel={t('fasting.activeScreen.endFast')}
        cancelLabel={t('nutrition.endFastPrompt.keepFasting')}
        accentColor="#C4463A"
        onConfirm={handleEnd}
        onCancel={() => setConfirmEnd(false)}
        confirmLoading={ending}
      />
    </FastingHeroLayout>
  );
};

const Row: React.FC<{ label: string; value: string; last?: boolean }> = React.memo(({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xxs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
      <AppText variant="bodySmall" color="#FFFFFF">
        {value}
      </AppText>
    </View>
  );
});
Row.displayName = 'Row';

/** Secondary action on the fasting hero screens — translucent border, no fill, dims on press. */
const OutlineButton: React.FC<{ label: string; onPress: () => void; style?: object }> = React.memo(({ label, onPress, style }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          height: theme.componentSizes.buttonHeight,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <AppText variant="headingSmall" color="#FFFFFF">
        {label}
      </AppText>
    </Pressable>
  );
});
OutlineButton.displayName = 'OutlineButton';

/** Tertiary/cancel action — text only, dims on press. */
const GhostButton: React.FC<{ label: string; onPress: () => void }> = React.memo(({ label, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: theme.componentSizes.buttonHeight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xxs,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <AppText variant="headingSmall" color="rgba(255,255,255,0.7)">
        {label}
      </AppText>
    </Pressable>
  );
});
GhostButton.displayName = 'GhostButton';
