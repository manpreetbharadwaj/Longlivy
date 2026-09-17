import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, BackHandler } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MeditationStackParamList, MainTabParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { HeroChip } from '@/components/common/HeroChip';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';
import { selectBreathingSchemes } from '@/features/meditation/selectors';
import { BreathingAnimation } from '@/features/meditation/components/BreathingAnimation';
import { BreathingPhase, useBreathingPhaseEngine } from '@/features/meditation/hooks/useBreathingPhaseEngine';
import { useBreathingPhaseCues } from '@/features/meditation/hooks/useBreathingPhaseCues';
import { useMeditationAmbientAudio, DEFAULT_AMBIENT_VOLUME_UNGUIDED } from '@/features/meditation/hooks/useMeditationAmbientAudio';
import { useMeditationSessionLifecycle } from '@/features/meditation/hooks/useMeditationSessionLifecycle';
import { useReducedMotionPreference } from '@/features/meditation/meditationVisualThemes';
import { BreathingBackgroundMode, isBreathingBackgroundModeAvailable, resolveBreathingBackgroundSource } from '@/features/meditation/breathingBackground';
import { startMeditationSessionThunk, recordSessionEventThunk, completeMeditationSessionThunk } from '@/features/meditation/meditationSlice';
import { calculateActiveSecondsFromEvents } from '@/features/meditation/services/MeditationSessionCalculator';
import { announce, stopAnnouncements } from '@/features/activity/services/VoiceAnnouncer';
import { ctaGradient } from '@/theme/gradients';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

// Same "well done" linger used by the main Player before it actually
// navigates away — long enough to register, short enough not to feel like a
// delay for what's typically a short exercise.
const COMPLETION_LINGER_MS = 1400;

const BACKGROUND_MODE_OPTIONS: BreathingBackgroundMode[] = ['none', 'meditation_music', 'ambient', 'nature'];

type BackgroundModeLabelKey =
  | 'meditation.breathing.background.meditationMusic'
  | 'meditation.breathing.background.ambient'
  | 'meditation.breathing.background.nature'
  | 'meditation.breathing.background.none';

function backgroundModeLabelKey(mode: BreathingBackgroundMode): BackgroundModeLabelKey {
  switch (mode) {
    case 'meditation_music':
      return 'meditation.breathing.background.meditationMusic';
    case 'ambient':
      return 'meditation.breathing.background.ambient';
    case 'nature':
      return 'meditation.breathing.background.nature';
    case 'none':
    default:
      return 'meditation.breathing.background.none';
  }
}

type VoiceCueKey = 'meditation.breathing.breatheIn' | 'meditation.breathing.breatheOut' | 'meditation.breathing.hold';

function voiceCueKey(phase: BreathingPhase): VoiceCueKey | null {
  switch (phase) {
    case 'inhale':
      return 'meditation.breathing.breatheIn';
    case 'exhale':
      return 'meditation.breathing.breatheOut';
    case 'hold':
    case 'secondHold':
      return 'meditation.breathing.hold';
    default:
      return null;
  }
}

export const BreathingExerciseScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'BreathingExercise'>>();
  const dispatch = useAppDispatch();
  const schemes = useAppSelector(selectBreathingSchemes);
  const scheme = schemes.find((s) => s.id === route.params.schemeId);
  const reducedMotion = useReducedMotionPreference();

  const engine = useBreathingPhaseEngine(scheme);
  const { phase, phaseProgress, repetitionIndex, totalRepetitions, isRunning, start: startEngine, stop: stopEngine } = engine;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState<BreathingBackgroundMode>('none');
  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(false);
  const sessionStartedRef = useRef(false);
  const finishedRef = useRef(false);
  const lastVoiceCuedPhaseRef = useRef<BreathingPhase | null>(null);

  useMeditationSessionLifecycle(sessionId, isRunning);
  useBreathingPhaseCues(phase, isRunning);

  const backgroundSource = resolveBreathingBackgroundSource(backgroundMode);
  const backgroundAudio = useMeditationAmbientAudio(backgroundSource, DEFAULT_AMBIENT_VOLUME_UNGUIDED);
  const { play: playBackground, pause: pauseBackground, stop: stopBackground, error: backgroundError } = backgroundAudio;

  // Background follows the exercise as one experience — playing only while
  // breathing is actually running, same coupling pattern as the main
  // Player's ambient layer (Phase 3 Section 29).
  useEffect(() => {
    if (!backgroundSource) return;
    if (isRunning) playBackground();
    else pauseBackground();
  }, [isRunning, backgroundSource, playBackground, pauseBackground]);

  useEffect(() => {
    if (!voiceGuidanceEnabled || !isRunning) return;
    if (lastVoiceCuedPhaseRef.current === phase) return;
    const key = voiceCueKey(phase);
    if (!key) return;
    lastVoiceCuedPhaseRef.current = phase;
    announce(t(key));
  }, [phase, isRunning, voiceGuidanceEnabled, t]);

  // Same immersive treatment as the meditation player — no tab icons
  // competing for attention while running a breathing exercise.
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  // The real Meditation session begins once breathing actually starts, not
  // during the brief "get comfortable" beat — same "tapping Start isn't the
  // same as duration beginning" principle used for Activity's countdown.
  useEffect(() => {
    if (!scheme || sessionStartedRef.current || !isRunning || phase === 'preparing') return;
    sessionStartedRef.current = true;
    const cycleSeconds = scheme.inhaleSeconds + scheme.holdSeconds + scheme.exhaleSeconds + scheme.secondHoldSeconds;
    dispatch(
      startMeditationSessionThunk({ meditationId: null, meditationTitle: scheme.name, type: 'breathing', plannedDurationSeconds: cycleSeconds * scheme.repetitions })
    ).then((result) => {
      if (startMeditationSessionThunk.fulfilled.match(result)) {
        setSessionId(result.payload.id);
      }
    });
  }, [scheme, isRunning, phase, dispatch]);

  const finish = useCallback(
    async (status: 'completed' | 'ended_prematurely') => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      stopEngine();
      stopBackground();
      if (voiceGuidanceEnabled) stopAnnouncements();
      if (!sessionId) {
        navigation.goBack();
        return;
      }
      await dispatch(recordSessionEventThunk({ sessionId, type: status === 'completed' ? 'completed' : 'stopped' }));
      // Same real-event-log derivation as the main Player (Phase 2A) —
      // never a synthetic start+end stand-in.
      const activeSession = store.getState().meditation.activeSession;
      const events = activeSession?.id === sessionId ? activeSession.events : [];
      const { activeSeconds, pausedSeconds } = calculateActiveSecondsFromEvents(events);
      await dispatch(completeMeditationSessionThunk({ sessionId, activeDurationSeconds: activeSeconds, pausedDurationSeconds: pausedSeconds, status }));
      navigation.goBack();
    },
    [sessionId, dispatch, navigation, stopEngine, stopBackground, voiceGuidanceEnabled]
  );

  // Natural completion — the engine reaching 'completed' on its own (all
  // repetitions finished) is now distinguishable from the user stopping
  // early, which finish('ended_prematurely') below represents instead.
  useEffect(() => {
    if (phase !== 'completed' || showCompletion) return;
    setShowCompletion(true);
    const timer = setTimeout(() => finish('completed'), COMPLETION_LINGER_MS);
    return () => clearTimeout(timer);
  }, [phase, showCompletion, finish]);

  const handleStop = useCallback(() => finish('ended_prematurely'), [finish]);

  const handleBack = useCallback(() => {
    if (isRunning) {
      finish('ended_prematurely');
    } else {
      navigation.goBack();
    }
  }, [isRunning, finish, navigation]);

  // Same rationale as MeditationPlayerScreen's handler — Android's
  // hardware/gesture back bypasses the header back arrow and the
  // navigator's (iOS-only) `gestureEnabled: false`, which would otherwise
  // let a running breathing session's Meditation record end up stuck
  // unfinished (QA finding).
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCompletion) return false;
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack, showCompletion]);

  if (!scheme) {
    return (
      <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.breathing.unavailable')} onBack={() => navigation.goBack()} scroll={false}>
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
            {t('meditation.breathing.unavailable')}
          </AppText>
        </View>
      </SectionHeroLayout>
    );
  }

  if (showCompletion) {
    return (
      <SectionHeroLayout environment={sectionEnvironments.meditation} scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppIcon name="checkmark-circle" size={48} color={dashboardColors.accent} />
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginTop: theme.spacing.sm }}>
            {t('meditation.breathing.wellDone')}
          </AppText>
        </View>
      </SectionHeroLayout>
    );
  }

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={scheme.name} onBack={handleBack} scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <GlowOrb size={280} color={dashboardColors.accent} opacity={isRunning ? 0.28 : 0.14} pulse={isRunning && !reducedMotion} style={{ top: -60, left: -60 }} />
          <BreathingAnimation phase={phase} phaseProgress={phaseProgress} running={isRunning} reducedMotion={reducedMotion} />
        </View>

        {isRunning && totalRepetitions > 0 ? (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.sm }}>
            {t('meditation.breathing.cycleProgress', { current: repetitionIndex + 1, total: totalRepetitions })}
          </AppText>
        ) : null}

        {/* Background audio failing must never affect the breathing session itself (Section 35) — visual/timing stays authoritative regardless. */}
        {isRunning && backgroundMode !== 'none' && backgroundError ? (
          <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginTop: 4 }}>
            {t('meditation.ambient.unavailable')}
          </AppText>
        ) : null}

        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.lg, maxWidth: 280 }}>
          {scheme.description}
        </AppText>

        {!isRunning ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: theme.spacing.lg }}>
              {BACKGROUND_MODE_OPTIONS.map((mode) => {
                const available = isBreathingBackgroundModeAvailable(mode);
                return (
                  <View key={mode} style={{ opacity: available ? 1 : 0.4 }}>
                    <HeroChip
                      label={t(backgroundModeLabelKey(mode))}
                      selected={backgroundMode === mode}
                      onPress={() => available && setBackgroundMode(mode)}
                      activeColor={dashboardColors.accent}
                    />
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setVoiceGuidanceEnabled((value) => !value)}
              accessibilityRole="button"
              accessibilityState={{ selected: voiceGuidanceEnabled }}
              accessibilityLabel={voiceGuidanceEnabled ? t('meditation.breathing.voiceGuidanceOn') : t('meditation.breathing.voiceGuidanceOff')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md }}
            >
              <AppIcon name={voiceGuidanceEnabled ? 'volume-high-outline' : 'volume-mute-outline'} size={16} color="rgba(255,255,255,0.6)" />
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }}>
                {voiceGuidanceEnabled ? t('meditation.breathing.voiceGuidanceOn') : t('meditation.breathing.voiceGuidanceOff')}
              </AppText>
            </Pressable>
          </>
        ) : null}
      </View>

      {isRunning ? (
        <AppGradientButton label={t('meditation.breathing.stop')} onPress={handleStop} colors={ctaGradient} />
      ) : (
        <AppGradientButton label={t('meditation.breathing.start')} onPress={startEngine} colors={ctaGradient} />
      )}
    </SectionHeroLayout>
  );
};
