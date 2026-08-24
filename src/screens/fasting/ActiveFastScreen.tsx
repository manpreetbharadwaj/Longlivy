import React, { useCallback, useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveFast } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM, calculateEnergySourceMix } from '@/features/fasting/services/FastingCalculator';
import { endFastThunk, extendFastThunk } from '@/features/fasting/fastingSlice';
import { FastingTimeline } from '@/features/fasting/components/FastingTimeline';
import { AutophagyInfoCard } from '@/features/fasting/components/AutophagyInfoCard';
import { EnergySourceVisualization } from '@/features/fasting/components/EnergySourceVisualization';
import { LiveMomentCard, MILESTONE_THRESHOLDS } from '@/features/fasting/components/LiveMomentCard';
import { TIMELINE_PHASES } from '@/features/fasting/fastingTimelineContent';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';
import { FastingHeroLayout } from './FastingHeroLayout';

function currentPhaseColor(elapsedHours: number): string {
  for (let i = TIMELINE_PHASES.length - 1; i >= 0; i--) {
    if (elapsedHours >= TIMELINE_PHASES[i].milestones[0].hours) return TIMELINE_PHASES[i].color;
  }
  return TIMELINE_PHASES[0].color;
}

export const ActiveFastScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const activeFast = useAppSelector(selectActiveFast);
  const progress = useFastingTimer(activeFast);
  const [showExtend, setShowExtend] = useState(false);
  const [extendHours, setExtendHours] = useState('2');
  const { preferences } = useAppPreferences();
  const [dismissedMilestones, setDismissedMilestones] = useState<Set<number>>(new Set());

  // A new fast (or reopening the screen for a different session) starts with a clean milestone queue.
  useEffect(() => {
    setDismissedMilestones(new Set());
  }, [activeFast?.id]);

  const activeMilestone = preferences.liveMomentsEnabled
    ? MILESTONE_THRESHOLDS.find((m) => (progress?.progress ?? 0) >= m && !dismissedMilestones.has(m))
    : undefined;

  const handleEnd = useCallback(async () => {
    if (!activeFast) return;
    const result = await dispatch(endFastThunk(activeFast));
    if (endFastThunk.fulfilled.match(result)) {
      navigation.replace('FastSummary', { sessionId: result.payload.id });
    }
  }, [activeFast, dispatch, navigation]);

  const handleExtend = useCallback(async () => {
    if (!activeFast) return;
    await dispatch(
      extendFastThunk({ sessionId: activeFast.id, additionalHours: Number(extendHours) || 1, currentPlannedEnd: activeFast.plannedEndTimestamp })
    );
    setShowExtend(false);
  }, [activeFast, dispatch, extendHours]);

  if (!activeFast || !progress) {
    return (
      <FastingHeroLayout title="Active fast" onBack={() => navigation.goBack()} scroll={false}>
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
            No active fast
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            Start a fast from the Fasting home screen.
          </AppText>
        </View>
      </FastingHeroLayout>
    );
  }

  const elapsedHours = progress.elapsedMs / (1000 * 60 * 60);
  const ringColor = currentPhaseColor(elapsedHours);
  const energyMix = calculateEnergySourceMix(elapsedHours);

  return (
    <FastingHeroLayout title={`${activeFast.method} Fast`} onBack={() => navigation.goBack()}>
      {activeMilestone ? (
        <LiveMomentCard milestone={activeMilestone} onDismiss={() => setDismissedMilestones((prev) => new Set(prev).add(activeMilestone))} />
      ) : null}

      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <AppProgressRing progress={progress.progress} size={240} strokeWidth={18} color={ringColor} trackColor="rgba(255,255,255,0.12)" glow>
          <AppText variant="metricLarge" color="#FFFFFF">
            {Math.round(Math.min(progress.progress, 1) * 100)}%
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)">
            Day {progress.currentFastingDay}
          </AppText>
        </AppProgressRing>

        <View style={{ flexDirection: 'row', marginTop: theme.spacing.md, width: '100%', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <AppText variant="headingMedium" color="#FFFFFF">
              {formatDurationHM(progress.elapsedMs)}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.5)">
              Elapsed
            </AppText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <AppText variant="headingMedium" color={progress.isOverdue ? '#3FCE87' : '#FFFFFF'}>
              {progress.isOverdue ? 'Reached' : formatDurationHM(progress.remainingMs)}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.5)">
              {progress.isOverdue ? 'Goal' : 'Remaining'}
            </AppText>
          </View>
        </View>
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
        <EnergySourceVisualization mix={energyMix} />
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
        <Row label="Started" value={new Date(activeFast.startTimestamp).toLocaleString()} />
        <Row label="Planned end" value={new Date(activeFast.plannedEndTimestamp).toLocaleString()} />
        <Row label="Extensions" value={`${activeFast.extensionCount}`} last />
      </View>

      {showExtend ? (
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
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg, gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <OutlineButton label="Extend" onPress={() => setShowExtend(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <AppGradientButton label="End fast" onPress={handleEnd} colors={['#DD7A68', '#C4463A']} />
          </View>
        </View>
      )}

      <View style={{ marginBottom: theme.spacing.md }}>
        <AutophagyInfoCard />
      </View>

      <FastingTimeline elapsedHours={elapsedHours} />
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
const OutlineButton: React.FC<{ label: string; onPress: () => void }> = React.memo(({ label, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: theme.componentSizes.buttonHeight,
        borderRadius: theme.radius.md,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
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
