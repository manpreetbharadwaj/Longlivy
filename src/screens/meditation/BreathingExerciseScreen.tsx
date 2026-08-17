import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MeditationStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectBreathingSchemes } from '@/features/meditation/selectors';
import { BreathingAnimation } from '@/features/meditation/components/BreathingAnimation';
import { startMeditationSessionThunk, completeMeditationSessionThunk } from '@/features/meditation/meditationSlice';

export const BreathingExerciseScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MeditationStackParamList, 'BreathingExercise'>>();
  const dispatch = useAppDispatch();
  const schemes = useAppSelector(selectBreathingSchemes);
  const scheme = schemes.find((s) => s.id === route.params.schemeId);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const start = useCallback(async () => {
    if (!scheme) return;
    const cycleSeconds = scheme.inhaleSeconds + scheme.holdSeconds + scheme.exhaleSeconds + scheme.secondHoldSeconds;
    const plannedDurationSeconds = cycleSeconds * scheme.repetitions;
    const result = await dispatch(
      startMeditationSessionThunk({ meditationId: null, meditationTitle: scheme.name, type: 'breathing', plannedDurationSeconds })
    );
    if (startMeditationSessionThunk.fulfilled.match(result)) {
      setSessionId(result.payload.id);
      setStartedAt(Date.now());
      setRunning(true);
    }
  }, [dispatch, scheme]);

  const finish = useCallback(async () => {
    setRunning(false);
    if (sessionId && startedAt) {
      const activeSeconds = Math.round((Date.now() - startedAt) / 1000);
      await dispatch(completeMeditationSessionThunk({ sessionId, activeDurationSeconds: activeSeconds, pausedDurationSeconds: 0, status: 'completed' }));
    }
    navigation.goBack();
  }, [sessionId, startedAt, dispatch, navigation]);

  if (!scheme) {
    return (
      <>
        <AppHeader title="Breathing exercise" onBack={() => navigation.goBack()} />
        <AppScreen>
          <AppEmptyState title="Breathing scheme unavailable" />
        </AppScreen>
      </>
    );
  }

  return (
    <>
      <AppHeader title={scheme.name} onBack={() => navigation.goBack()} />
      <AppScreen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <BreathingAnimation scheme={scheme} running={running} />
          <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.lg, maxWidth: 280 }}>
            {scheme.description}
          </AppText>
        </View>
        {running ? (
          <AppButton label="Finish" onPress={finish} />
        ) : (
          <AppButton label="Start breathing exercise" onPress={start} />
        )}
      </AppScreen>
    </>
  );
};
