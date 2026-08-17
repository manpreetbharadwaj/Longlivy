import React, { useCallback, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppInput } from '@/components/common/AppInput';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveFast } from '@/features/fasting/selectors';
import { useFastingTimer } from '@/features/fasting/hooks/useFastingTimer';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { endFastThunk, extendFastThunk } from '@/features/fasting/fastingSlice';
import { FastingTimeline } from '@/features/fasting/components/FastingTimeline';
import { AutophagyInfoCard } from '@/features/fasting/components/AutophagyInfoCard';
import { LiveMomentCard, MILESTONE_THRESHOLDS } from '@/features/fasting/components/LiveMomentCard';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';

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
      <>
        <AppHeader title="Active fast" onBack={() => navigation.goBack()} />
        <AppScreen>
          <AppEmptyState title="No active fast" message="Start a fast from the Fasting home screen." />
        </AppScreen>
      </>
    );
  }

  const elapsedHours = progress.elapsedMs / (1000 * 60 * 60);

  return (
    <>
      <AppHeader title={`${activeFast.method} Fast`} onBack={() => navigation.goBack()} />
      <AppScreen>
        {activeMilestone ? (
          <LiveMomentCard milestone={activeMilestone} onDismiss={() => setDismissedMilestones((prev) => new Set(prev).add(activeMilestone))} />
        ) : null}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <AppProgressRing progress={progress.progress} size={240} strokeWidth={18} color={theme.colors.fasting}>
            <AppText variant="metricLarge">{Math.round(Math.min(progress.progress, 1) * 100)}%</AppText>
            <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
              Day {progress.currentFastingDay}
            </AppText>
          </AppProgressRing>

          <View style={{ flexDirection: 'row', marginTop: theme.spacing.md, width: '100%', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="headingMedium">{formatDurationHM(progress.elapsedMs)}</AppText>
              <AppText variant="caption" color={theme.colors.textSecondary}>
                Elapsed
              </AppText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="headingMedium" color={progress.isOverdue ? theme.colors.success : theme.colors.textPrimary}>
                {progress.isOverdue ? 'Reached' : formatDurationHM(progress.remainingMs)}
              </AppText>
              <AppText variant="caption" color={theme.colors.textSecondary}>
                {progress.isOverdue ? 'Goal' : 'Remaining'}
              </AppText>
            </View>
          </View>
        </View>

        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <Row label="Started" value={new Date(activeFast.startTimestamp).toLocaleString()} />
          <Row label="Planned end" value={new Date(activeFast.plannedEndTimestamp).toLocaleString()} />
          <Row label="Extensions" value={`${activeFast.extensionCount}`} last />
        </AppCard>

        {showExtend ? (
          <AppCard style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
              Extend this fast
            </AppText>
            <AppInput label="Additional hours" value={extendHours} onChangeText={setExtendHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
            <AppButton label="Confirm extension" onPress={handleExtend} />
            <AppButton label="Cancel" onPress={() => setShowExtend(false)} variant="ghost" style={{ marginTop: theme.spacing.xxs }} />
          </AppCard>
        ) : (
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
            <AppButton label="Extend" onPress={() => setShowExtend(true)} variant="outline" style={{ flex: 1, marginRight: theme.spacing.xs }} />
            <AppButton label="End fast" onPress={handleEnd} variant="primary" style={{ flex: 1 }} />
          </View>
        )}

        <AutophagyInfoCard />
        <FastingTimeline elapsedHours={elapsedHours} />
      </AppScreen>
    </>
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
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodySmall" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodySmall">{value}</AppText>
    </View>
  );
});
Row.displayName = 'Row';
