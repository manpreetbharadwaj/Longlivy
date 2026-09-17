import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, interpolate, Easing } from 'react-native-reanimated';
import { MeditationStackParamList, MainTabParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { ctaGradient } from '@/theme/gradients';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';
import { selectMeditationContent } from '@/features/meditation/selectors';
import { startMeditationSessionThunk, recordSessionEventThunk, completeMeditationSessionThunk } from '@/features/meditation/meditationSlice';
import { calculateActiveSecondsFromEvents } from '@/features/meditation/services/MeditationSessionCalculator';
import { formatDurationHMS } from '@/features/fasting/services/FastingCalculator';
import { resolveMeditationAudioSource } from '@/features/meditation/meditationAudio';
import { resolveAmbientAudioSource } from '@/features/meditation/meditationAmbientAudio';
import { getMeditationVisualThemeConfig, applyReducedMotion, useReducedMotionPreference } from '@/features/meditation/meditationVisualThemes';
import { getAmbientSound, getRecommendedAmbientSounds, hasAnyAvailableAmbientSound } from '@/features/meditation/ambientSounds';
import { useMeditationAudioSession } from '@/features/meditation/hooks/useMeditationAudioSession';
import { useMeditationAmbientAudio, DEFAULT_AMBIENT_VOLUME_GUIDED, DEFAULT_AMBIENT_VOLUME_UNGUIDED } from '@/features/meditation/hooks/useMeditationAmbientAudio';
import { useMeditationSessionLifecycle } from '@/features/meditation/hooks/useMeditationSessionLifecycle';
import { AmbientAudioVisualizer } from '@/features/meditation/components/AmbientAudioVisualizer';
import { MeditationBreathingVisual } from '@/features/meditation/components/MeditationBreathingVisual';
import { MeditationParticles } from '@/features/meditation/components/MeditationParticles';
import { AmbientSoundPickerModal } from '@/features/meditation/components/AmbientSoundPickerModal';
import { MEDITATION_SESSION_BACKGROUND_SOURCE } from '@/features/meditation/meditationSessionBackground';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

// How long the "well done" completion moment stays on screen before the
// session actually navigates away — long enough to register as a deliberate
// close, short enough not to feel like a delay.
const COMPLETION_LINGER_MS = 1600;
const VISUAL_SIZE = 260;
const RING_SIZE = 236;

export const MeditationPlayerScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationPlayer'>>();
  const dispatch = useAppDispatch();
  const content = useAppSelector(selectMeditationContent);
  const meditation = content.find((m) => m.id === route.params.meditationId);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Ambient selection is session/Player-local only (Section 26) — never
  // persisted to the Meditation session/history record, and reset every time
  // this screen mounts fresh.
  const [selectedAmbientId, setSelectedAmbientId] = useState<string | null>(null);
  const [showSoundscapePicker, setShowSoundscapePicker] = useState(false);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  const title = meditation?.title ?? (route.params.type === 'free' ? t('meditation.player.unguidedFallbackTitle') : t('meditation.player.fallbackTitle'));
  // Defense-in-depth: MeditationDetailsScreen already blocks navigating here
  // for a 'coming_soon' item, but this guard means reaching this screen with
  // one some other way (a stale deep link, a future call site) still can't
  // resolve audio or create a session/history record.
  const isComingSoon = meditation?.availability === 'coming_soon';
  const plannedSeconds = route.params.durationSeconds;
  const audioSource = isComingSoon ? null : resolveMeditationAudioSource(meditation?.audioReference);
  const audioSession = useMeditationAudioSession(audioSource, plannedSeconds);
  const { elapsedSeconds, remainingSeconds, status: sessionStatus } = audioSession;
  const isPlaying = sessionStatus === 'playing';

  // Ambient (Soundscape) layer — a fully separate, independent player
  // instance from the primary audioSession above (Section 6: primary vs
  // ambient are never merged into one audio field/player). Guided sessions
  // default the ambient layer quieter than Unguided so it never competes
  // with the voice (Phase 5 Section 13/14).
  const selectedAmbientSound = selectedAmbientId ? getAmbientSound(selectedAmbientId) : undefined;
  const ambientAudioSource = resolveAmbientAudioSource(selectedAmbientSound?.audioReference);
  const ambientAudio = useMeditationAmbientAudio(ambientAudioSource, route.params.type === 'guided' ? DEFAULT_AMBIENT_VOLUME_GUIDED : DEFAULT_AMBIENT_VOLUME_UNGUIDED);
  const { play: playAmbient, pause: pauseAmbient, stop: stopAmbient, volume: ambientVolume, setVolume: setAmbientVolume, error: ambientError } = ambientAudio;

  // The two layers behave as one experience from the user's point of view
  // (Section 29): whenever the primary session's playing state changes, or a
  // different sound is picked, ambient follows — never started on its own.
  useEffect(() => {
    if (!ambientAudioSource) return;
    if (isPlaying) playAmbient();
    else pauseAmbient();
  }, [isPlaying, ambientAudioSource, playAmbient, pauseAmbient]);

  useMeditationSessionLifecycle(sessionId, !showCompletion);

  const reducedMotion = useReducedMotionPreference();
  const visualTheme = applyReducedMotion(getMeditationVisualThemeConfig(meditation, selectedAmbientSound?.type ?? null), reducedMotion);
  const recommendedAmbientIds = meditation ? getRecommendedAmbientSounds(meditation.category).map((sound) => sound.id) : [];
  const soundscapeAvailable = hasAnyAvailableAmbientSound();

  // An active session is the moment the redesign should feel most
  // immersive — no tab icons competing for attention while sitting with it.
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => parent?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

  useEffect(() => {
    if (startedRef.current || isComingSoon) return;
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
      }
    });
    audioSession.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePause = useCallback(() => {
    if (!sessionId) return;
    if (sessionStatus === 'playing') {
      dispatch(recordSessionEventThunk({ sessionId, type: 'paused' }));
      audioSession.pause();
    } else if (sessionStatus === 'paused') {
      dispatch(recordSessionEventThunk({ sessionId, type: 'resumed' }));
      audioSession.resume();
    }
  }, [dispatch, sessionStatus, sessionId, audioSession]);

  const finish = useCallback(
    async (status: 'completed' | 'ended_prematurely') => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      audioSession.stop();
      stopAmbient();
      if (!sessionId) {
        navigation.popToTop();
        return;
      }
      await dispatch(recordSessionEventThunk({ sessionId, type: status === 'completed' ? 'completed' : 'stopped' }));
      // The dispatch above has just appended the final event to
      // state.meditation.activeSession.events (recordSessionEventThunk's
      // reducer runs synchronously as part of that await), so the store now
      // holds the complete, real event log for this session — started, every
      // paused/resumed in between, and the closing completed/stopped — not a
      // synthetic stand-in. Derive active/paused seconds from that.
      const activeSession = store.getState().meditation.activeSession;
      const events = activeSession?.id === sessionId ? activeSession.events : [];
      const { activeSeconds, pausedSeconds } = calculateActiveSecondsFromEvents(events);
      await dispatch(
        completeMeditationSessionThunk({
          sessionId,
          activeDurationSeconds: activeSeconds || elapsedSeconds,
          pausedDurationSeconds: pausedSeconds,
          status,
        })
      );
      navigation.popToTop();
    },
    [sessionId, elapsedSeconds, dispatch, navigation, audioSession, stopAmbient]
  );

  // The session duration is authoritative — the instant the hook reports
  // completion (audio already stopped), let the ring settle into its "well
  // done" state for a moment before actually finishing/navigating away.
  useEffect(() => {
    if (sessionStatus !== 'completed' || showCompletion) return;
    setShowCompletion(true);
    const timer = setTimeout(() => finish('completed'), COMPLETION_LINGER_MS);
    return () => clearTimeout(timer);
  }, [sessionStatus, showCompletion, finish]);

  // Leaving mid-session risks losing progress the user might not have meant
  // to discard — an in-progress session confirms first; anything else (still
  // loading, or already wrapping up) exits straight away.
  const requestExit = useCallback(() => {
    if (sessionStatus === 'playing' || sessionStatus === 'paused') {
      setShowExitConfirm(true);
    } else {
      finish('ended_prematurely');
    }
  }, [sessionStatus, finish]);

  const confirmEndSession = useCallback(() => {
    setShowExitConfirm(false);
    finish('ended_prematurely');
  }, [finish]);

  // Android's hardware/gesture back button bypasses the header back arrow
  // entirely (and isn't covered by the navigator's `gestureEnabled: false`,
  // which is an iOS swipe-back concept) — without this, it would pop the
  // screen straight past requestExit()/finish(), leaving audio playing and
  // the session stuck unfinished (QA finding).
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showCompletion) return false;
      requestExit();
      return true;
    });
    return () => subscription.remove();
  }, [requestExit, showCompletion]);

  const progress = plannedSeconds > 0 ? elapsedSeconds / plannedSeconds : 0;

  if (isComingSoon) {
    return (
      <SectionHeroLayout environment={sectionEnvironments.meditation} onBack={() => navigation.goBack()} scroll={false}>
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
            <AppIcon name="time-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {title}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            {t('meditation.player.comingSoonBody')}
          </AppText>
        </View>
      </SectionHeroLayout>
    );
  }

  return (
    <SectionHeroLayout
      environment={sectionEnvironments.meditation}
      backgroundImageSource={MEDITATION_SESSION_BACKGROUND_SOURCE}
      onBack={showCompletion ? undefined : requestExit}
      scroll={false}
    >
      <FadeSlideIn fromScale={0.96} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="headingMedium" color="#FFFFFF" style={{ marginBottom: theme.spacing.lg }}>
            {title}
          </AppText>

          <View style={{ width: VISUAL_SIZE, height: VISUAL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <GlowOrb
              size={VISUAL_SIZE * 1.5}
              color={visualTheme.accentColor}
              opacity={isPlaying ? visualTheme.glowOpacityPlaying : visualTheme.glowOpacityIdle}
              pulse={visualTheme.glowPulse && isPlaying}
              style={{ top: (VISUAL_SIZE - VISUAL_SIZE * 1.5) / 2, left: (VISUAL_SIZE - VISUAL_SIZE * 1.5) / 2 }}
            />
            <MeditationParticles size={VISUAL_SIZE} color={visualTheme.accentColor} active={isPlaying} density={visualTheme.particleDensity} />
            <AppProgressRing
              progress={progress}
              size={RING_SIZE}
              strokeWidth={14}
              color={visualTheme.accentColor}
              trackColor="rgba(255,255,255,0.12)"
              glow={isPlaying || showCompletion}
            >
              {showCompletion ? (
                <FadeSlideIn>
                  <View style={{ alignItems: 'center' }}>
                    <AppIcon name="checkmark-circle" size={48} color={visualTheme.accentColor} />
                    <AppText variant="headingSmall" color="#FFFFFF" style={{ marginTop: theme.spacing.sm }}>
                      {t('meditation.player.wellDone')}
                    </AppText>
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.55)" style={{ marginTop: 2 }}>
                      {t('meditation.player.minCompleted', { minutes: Math.round(plannedSeconds / 60) })}
                    </AppText>
                  </View>
                </FadeSlideIn>
              ) : (
                <>
                  <MeditationBreathingVisual active={isPlaying} size={36} color="#FFFFFF" />
                  <AppText variant="metricLarge" color="#FFFFFF" style={{ marginTop: theme.spacing.xs }}>
                    {formatDurationHMS(remainingSeconds * 1000).replace(/^00:/, '')}
                  </AppText>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                    {t('meditation.player.ofMin', { minutes: Math.round(plannedSeconds / 60) })}
                  </AppText>
                </>
              )}
            </AppProgressRing>
          </View>

          {showCompletion ? null : sessionStatus === 'loading' ? (
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.md }}>
              {t('meditation.player.preparing')}
            </AppText>
          ) : audioSession.audioError ? (
            <AppText variant="bodySmall" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.md }}>
              {t('meditation.player.audioUnavailable')}
            </AppText>
          ) : audioSession.hasAudio ? (
            <View style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
              <AmbientAudioVisualizer playing={isPlaying} color={visualTheme.accentColor} />
              <AppText variant="bodySmall" color="rgba(255,255,255,0.4)" style={{ marginTop: theme.spacing.sm }}>
                {formatDurationHMS(audioSession.audioPositionSeconds * 1000).replace(/^00:/, '')} / {formatDurationHMS(audioSession.audioDurationSeconds * 1000).replace(/^00:/, '')}
              </AppText>
            </View>
          ) : null}
        </View>

        {showCompletion ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.lg }}>
            {/* Balances the Soundscape button on the other side so the main
                control stays visually centered — only reserved when that
                button actually renders (Section 12: keep the Player calm). */}
            {soundscapeAvailable ? <View style={{ width: 44 + theme.spacing.md }} /> : null}
            <PlayPauseControl playing={isPlaying} onPress={togglePause} accentColor={visualTheme.accentColor} />
            {soundscapeAvailable ? (
              <Pressable
                onPress={() => setShowSoundscapePicker(true)}
                accessibilityRole="button"
                accessibilityLabel={t('meditation.ambient.control')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  marginLeft: theme.spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <AppIcon name="cloud-outline" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Ambient failing to load/play must never affect the primary session
            (Section 34) — it just shows a small note and keeps playing. */}
        {!showCompletion && selectedAmbientId && ambientError ? (
          <AppText variant="caption" color="rgba(255,255,255,0.4)" align="center" style={{ marginTop: theme.spacing.sm }}>
            {t('meditation.ambient.unavailable')}
          </AppText>
        ) : null}
      </FadeSlideIn>

      <AmbientSoundPickerModal
        visible={showSoundscapePicker}
        selectedId={selectedAmbientId}
        recommendedIds={recommendedAmbientIds}
        volume={ambientVolume}
        onVolumeChange={setAmbientVolume}
        onClose={() => setShowSoundscapePicker(false)}
        onSelect={setSelectedAmbientId}
      />

      <ConfirmDialog
        visible={showExitConfirm}
        title={t('meditation.exitConfirm.title')}
        message={t('meditation.exitConfirm.message')}
        confirmLabel={t('meditation.exitConfirm.end')}
        cancelLabel={t('meditation.exitConfirm.continue')}
        accentColor={dashboardColors.accent}
        onConfirm={confirmEndSession}
        onCancel={() => setShowExitConfirm(false)}
      />
    </SectionHeroLayout>
  );
};

const CONTROL_SIZE = 76;
const HALO_DURATION = 2600;

/**
 * The session's large central control — the app's own blue CTA gradient
 * (same "raised action" language as the tab bar's CenterActionButton) with a
 * breathing halo behind it that only runs while audio is actually playing,
 * so the control itself communicates play/pause state at a glance rather
 * than relying on the small icon alone.
 */
const PlayPauseControl: React.FC<{ playing: boolean; onPress: () => void; accentColor?: string }> = React.memo(({ playing, onPress, accentColor = dashboardColors.accent }) => {
  const { t } = useTranslation();
  const pressScale = useSharedValue(1);
  const haloProgress = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      haloProgress.value = withRepeat(withTiming(1, { duration: HALO_DURATION, easing: Easing.out(Easing.cubic) }), -1, false);
    } else {
      haloProgress.value = withTiming(0, { duration: motion.duration.base });
    }
  }, [playing, haloProgress]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: playing ? interpolate(haloProgress.value, [0, 1], [0.35, 0]) : 0,
    transform: [{ scale: interpolate(haloProgress.value, [0, 1], [1, 1.3]) }],
  }));

  const haloSize = CONTROL_SIZE * 1.3;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.92, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={playing ? t('meditation.player.pause') : t('meditation.player.resume')}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: accentColor,
            top: -(haloSize - CONTROL_SIZE) / 2,
            left: -(haloSize - CONTROL_SIZE) / 2,
          },
          haloStyle,
        ]}
      />
      <Animated.View style={[{ width: CONTROL_SIZE, height: CONTROL_SIZE, borderRadius: CONTROL_SIZE / 2 }, pressStyle]}>
        <LinearGradient
          colors={ctaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: CONTROL_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.28)',
          }}
        >
          <AppIcon name={playing ? 'pause' : 'play'} size={CONTROL_SIZE * 0.38} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});
PlayPauseControl.displayName = 'PlayPauseControl';
