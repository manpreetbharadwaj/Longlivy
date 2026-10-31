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

const TRANSITION_LABEL = {
  eating_begins: 'Eating window begins',
  fasting_begins: 'Fasting begins',
  goal_reached: 'Goal reached',
} as const;

export const ActiveFastScreen: React.FC = () => {
  const { theme } = useTheme();
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
      Alert.alert('Saved', 'Your fasting session has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.replace('FastSummary', { sessionId: result.payload.id }) },
      ]);
    } else {
      // Rejected via the `.fulfilled.match()` pattern, not `.unwrap()` — `result.error` is
      // already the plain object `createAsyncThunk` always produces, and `.message` on it
      // is read directly here (no `instanceof Error` check to trip over, unlike the bug
      // fixed in SelectFastingMethodScreen's catch block for the same class of error).
      // The active session itself was never touched locally, so it's still exactly as it
      // was before the attempt — nothing to roll back.
      Alert.alert('Fast not ended', result.error.message ?? 'Please try again.');
    }
  }, [activeFast, dispatch, ending, navigation]);

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
      <FastingHeroLayout title={schedule ? 'Your schedule' : 'Active fast'} onBack={() => navigation.goBack()} scroll={false}>
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
            {state.nextFastStart ? 'No fast running' : 'No active fast'}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.lg }}>
            {state.nextFastStart
              ? `Your next fast begins ${formatDayClock(state.nextFastStart, now)}, in ${formatSpan(state.nextFastStart.getTime() - now.getTime())}.`
              : 'Start a fast from the Fasting home screen.'}
          </AppText>
          <View style={{ alignSelf: 'stretch' }}>
            <AppGradientButton label="Start a fast" onPress={startFast} colors={['#5C7A94', '#3D5266']} />
            {schedule ? <GhostButton label="Edit schedule" onPress={editSchedule} /> : null}
          </View>
        </View>
      </FastingHeroLayout>
    );
  }

  const fastingHours = state.fastStart && state.fastEnd ? (state.fastEnd.getTime() - state.fastStart.getTime()) / HOUR : 0;
  const fastingElapsedHours = isFasting ? state.elapsedMs / HOUR : fastingHours;
  const daily = state.eatingStart != null;
  const modelLabel = activeFast
    ? sessionModelLabel(activeFast)
    : schedule && plan
      ? formatModelLabel({ method: plan.method, fastingHours: schedule.fastingHours, eatingHours: schedule.eatingHours })
      : formatModelLabel({ method: 'individual', fastingHours: Math.round(fastingHours), eatingHours: 8 });

  const ringColor = isFasting ? currentPhaseColor(fastingElapsedHours) : EATING_COLOR;
  const phaseLabel = isFasting ? (state.goalReached ? 'GOAL REACHED' : 'FASTING') : 'EATING WINDOW';
  const countdownMs = state.goalReached ? state.elapsedMs : Math.max(state.remainingMs, 0);
  const countdownCaption = state.goalReached ? 'fasting time' : isFasting ? (daily ? 'until your eating window begins' : 'until your goal') : 'until fasting begins';
  const transition = state.nextTransition;

  return (
    <FastingHeroLayout title={isFasting ? `${modelLabel} Fast` : 'Eating window'} onBack={() => navigation.goBack()}>
      {activeMilestone ? (
        <LiveMomentCard milestone={activeMilestone} onDismiss={() => setDismissedMilestones((prev) => new Set(prev).add(activeMilestone))} />
      ) : null}

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppProgressRing progress={state.progress} size={240} strokeWidth={18} color={ringColor} trackColor="rgba(255,255,255,0.12)" glow>
          <AppText variant="label" color={ringColor} style={{ letterSpacing: 1.2 }}>
            {phaseLabel}
          </AppText>
          <AppText variant="metricLarge" color="#FFFFFF" style={{ marginTop: 2 }} accessibilityLabel={`${phaseLabel}, ${formatSpan(countdownMs)} ${countdownCaption}`}>
            {formatDurationHMS(countdownMs)}
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" align="center" style={{ paddingHorizontal: theme.spacing.md }}>
            {countdownCaption}
          </AppText>
          {isFasting && isMultiDayFast(fastingHours) ? (
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>
              Day {Math.max(1, Math.ceil(state.elapsedMs / (24 * HOUR)))}
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
              {TRANSITION_LABEL[transition.kind]} · {formatDayClock(transition.at, now)}
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
        {isFasting ? <Row label="Elapsed" value={formatSpan(state.elapsedMs)} /> : null}
        {daily && state.fastStart && state.fastEnd && state.eatingStart && state.eatingEnd ? (
          <>
            <Row label="Fasting begins" value={formatDayClock(state.fastStart, now)} />
            <Row label="Fasting duration" value={formatSpan(state.fastEnd.getTime() - state.fastStart.getTime())} />
            <Row label="Eating window begins" value={formatDayClock(state.eatingStart, now)} />
            <Row label="Eating window" value={formatSpan(state.eatingEnd.getTime() - state.eatingStart.getTime())} />
            <Row label="Next fasting phase" value={state.nextFastStart ? formatDayClock(state.nextFastStart, now) : '-'} last={!activeFast || activeFast.extensionCount === 0} />
          </>
        ) : state.fastStart && state.fastEnd ? (
          <>
            <Row label="Started" value={formatDayClock(state.fastStart, now)} />
            <Row label="Fast length" value={formatSpan(state.fastEnd.getTime() - state.fastStart.getTime())} />
            <Row label="Planned end" value={formatDayClock(state.fastEnd, now)} last={!activeFast || activeFast.extensionCount === 0} />
          </>
        ) : null}
        {activeFast && activeFast.extensionCount > 0 ? <Row label="Extensions" value={`${activeFast.extensionCount}`} last /> : null}
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
            Extend this fast
          </AppText>
          <HeroTextField label="Additional hours" value={extendHours} onChangeText={setExtendHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
          <AppGradientButton label="Confirm extension" onPress={handleExtend} />
          <GhostButton label="Cancel" onPress={() => setShowExtend(false)} />
        </View>
      ) : (
        <View style={{ marginBottom: theme.spacing.md }}>
          {activeFast ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <OutlineButton label="Extend" onPress={() => setShowExtend(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <AppGradientButton label="End fast" onPress={() => setConfirmEnd(true)} loading={ending} disabled={ending} colors={['#DD7A68', '#C4463A']} />
              </View>
            </View>
          ) : null}
          <OutlineButton label="Edit schedule" onPress={editSchedule} style={{ marginTop: activeFast ? theme.spacing.sm : 0 }} />
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
        title="End this fast?"
        message={
          reachedPlannedEnd
            ? 'You reached your planned fasting time. It will be saved as completed.'
            : "You haven't reached your planned fasting time yet. It will be saved as ended early."
        }
        confirmLabel="End fast"
        cancelLabel="Keep fasting"
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
