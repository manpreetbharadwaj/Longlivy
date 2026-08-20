import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationContent } from '@/features/meditation/selectors';
import { startMeditationSessionThunk, recordSessionEventThunk, completeMeditationSessionThunk } from '@/features/meditation/meditationSlice';
import { calculateActiveSecondsFromEvents } from '@/features/meditation/services/MeditationSessionCalculator';
import { formatDurationHMS } from '@/features/fasting/services/FastingCalculator';
import { MeditationHeroLayout } from './MeditationHeroLayout';

export const MeditationPlayerScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationPlayer'>>();
  const dispatch = useAppDispatch();
  const content = useAppSelector(selectMeditationContent);
  const meditation = content.find((m) => m.id === route.params.meditationId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const startedRef = useRef(false);

  const title = meditation?.title ?? (route.params.type === 'free' ? 'Free meditation' : 'Meditation');
  const plannedSeconds = route.params.durationSeconds;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    dispatch(
      startMeditationSessionThunk({
        meditationId: route.params.meditationId,
        meditationTitle: title,
        type: route.params.type,
        plannedDurationSeconds: plannedSeconds,
      })
    ).then((result) => {
      if (startMeditationSessionThunk.fulfilled.match(result)) {
        setSessionId(result.payload.id);
        setIsRunning(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setDisplaySeconds((s) => Math.min(s + 1, plannedSeconds)), 1000);
    return () => clearInterval(interval);
  }, [isRunning, plannedSeconds]);

  useEffect(() => {
    if (displaySeconds >= plannedSeconds && plannedSeconds > 0) {
      setIsRunning(false);
    }
  }, [displaySeconds, plannedSeconds]);

  const togglePause = useCallback(() => {
    if (!sessionId) return;
    if (isRunning) {
      dispatch(recordSessionEventThunk({ sessionId, type: 'paused' }));
      setIsRunning(false);
    } else {
      dispatch(recordSessionEventThunk({ sessionId, type: 'resumed' }));
      setIsRunning(true);
    }
  }, [dispatch, isRunning, sessionId]);

  const finish = useCallback(
    async (status: 'completed' | 'ended_prematurely') => {
      if (!sessionId) {
        navigation.popToTop();
        return;
      }
      await dispatch(recordSessionEventThunk({ sessionId, type: status === 'completed' ? 'completed' : 'stopped' }));
      // Derive authoritative active/paused seconds from the event log rather
      // than trusting the client-side display timer alone.
      const events = [
        { id: 'e1', sessionId, type: 'started' as const, timestamp: new Date(Date.now() - displaySeconds * 1000).toISOString() },
        { id: 'e2', sessionId, type: status === 'completed' ? ('completed' as const) : ('stopped' as const), timestamp: new Date().toISOString() },
      ];
      const { activeSeconds, pausedSeconds } = calculateActiveSecondsFromEvents(events);
      await dispatch(
        completeMeditationSessionThunk({
          sessionId,
          activeDurationSeconds: activeSeconds || displaySeconds,
          pausedDurationSeconds: pausedSeconds,
          status,
        })
      );
      navigation.popToTop();
    },
    [sessionId, displaySeconds, dispatch, navigation]
  );

  const progress = plannedSeconds > 0 ? displaySeconds / plannedSeconds : 0;

  return (
    <MeditationHeroLayout scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="headingMedium" color="#FFFFFF" style={{ marginBottom: theme.spacing.lg }}>
          {title}
        </AppText>
        <AppProgressRing progress={progress} size={240} strokeWidth={16} color="#B98CE0" trackColor="rgba(255,255,255,0.12)" glow>
          <AppText variant="metricLarge" color="#FFFFFF">
            {formatDurationHMS(displaySeconds * 1000).replace(/^00:/, '')}
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
            of {Math.round(plannedSeconds / 60)} min
          </AppText>
        </AppProgressRing>
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <OutlineButton label={isRunning ? 'Pause' : 'Resume'} onPress={togglePause} />
        </View>
        <View style={{ flex: 1 }}>
          <AppGradientButton
            label="Finish"
            onPress={() => finish(displaySeconds >= plannedSeconds ? 'completed' : 'ended_prematurely')}
            colors={['#B98CE0', '#4A3A7A']}
          />
        </View>
      </View>
    </MeditationHeroLayout>
  );
};

/** Secondary action on the meditation hero screens — translucent border, no fill, dims on press. Matches ActiveFastScreen's OutlineButton. */
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
