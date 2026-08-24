import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MeditationStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectBreathingSchemes } from '@/features/meditation/selectors';
import { BreathingAnimation } from '@/features/meditation/components/BreathingAnimation';
import { startMeditationSessionThunk, completeMeditationSessionThunk } from '@/features/meditation/meditationSlice';
import { MeditationHeroLayout } from './MeditationHeroLayout';

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
      <MeditationHeroLayout title="Breathing exercise" onBack={() => navigation.goBack()} scroll={false}>
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
            <AppIcon name="pulse-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Breathing scheme unavailable
          </AppText>
        </View>
      </MeditationHeroLayout>
    );
  }

  return (
    <MeditationHeroLayout title={scheme.name} onBack={() => navigation.goBack()} scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BreathingAnimation scheme={scheme} running={running} />
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.lg, maxWidth: 280 }}>
          {scheme.description}
        </AppText>
      </View>
      {running ? (
        <AppGradientButton label="Finish" onPress={finish} colors={['#A78BC9', '#453569']} />
      ) : (
        <AppGradientButton label="Start breathing exercise" onPress={start} colors={['#A78BC9', '#453569']} />
      )}
    </MeditationHeroLayout>
  );
};
