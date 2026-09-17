import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTranslation } from '@/localization';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { BreathingPhase } from '../hooks/useBreathingPhaseEngine';

interface BreathingAnimationProps {
  phase: BreathingPhase;
  /** 0..1 progress through the current phase, from the same engine driving `phase`. */
  phaseProgress: number;
  running: boolean;
  reducedMotion?: boolean;
}

const REST_SCALE = 0.62;
const EXPANDED_SCALE = 1;
// Slightly above the engine's own 100ms tick so each step's `withTiming` call
// has just landed before the next tick retargets it — smooth continuous
// motion built from discrete, exactly-in-sync progress updates rather than a
// second independent animation clock.
const TICK_TRANSITION_MS = 120;
const HOLD_PULSE_AMPLITUDE = 0.02;

function scaleForPhase(phase: BreathingPhase, progress: number): number {
  switch (phase) {
    case 'inhale':
      return REST_SCALE + (EXPANDED_SCALE - REST_SCALE) * progress;
    case 'hold':
      return EXPANDED_SCALE;
    case 'exhale':
      return EXPANDED_SCALE - (EXPANDED_SCALE - REST_SCALE) * progress;
    case 'secondHold':
    case 'preparing':
    case 'completed':
    default:
      return REST_SCALE;
  }
}

function usePhaseLabel(phase: BreathingPhase): string {
  const { t } = useTranslation();
  switch (phase) {
    case 'preparing':
      return t('meditation.breathing.getComfortable');
    case 'inhale':
      return t('meditation.breathing.breatheIn');
    case 'exhale':
      return t('meditation.breathing.breatheOut');
    case 'hold':
    case 'secondHold':
    case 'completed':
    default:
      return t('meditation.breathing.hold');
  }
}

/**
 * Purely a function of the breathing engine's current phase/progress (see
 * useBreathingPhaseEngine) — owns no timer of its own, so the visual can
 * never drift from the phase durations that actually govern the exercise
 * (Section 3: engine controls phase, visual reacts to it).
 *
 * Migrated from React Native's `Animated` to Reanimated for consistency with
 * every other Meditation visual (MeditationBreathingVisual,
 * AmbientAudioVisualizer, MeditationParticles). Safe to migrate now: the
 * previous version's risk was its own `.start(() => next())` recursive
 * timing chain owning the phase sequence itself — that's gone, this
 * component no longer decides timing at all, only renders it.
 */
export const BreathingAnimation: React.FC<BreathingAnimationProps> = React.memo(({ phase, phaseProgress, running, reducedMotion = false }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(REST_SCALE);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!running) {
      scale.value = withTiming(REST_SCALE, { duration: 400 });
      return;
    }
    scale.value = withTiming(scaleForPhase(phase, phaseProgress), { duration: TICK_TRANSITION_MS, easing: Easing.linear });
  }, [running, phase, phaseProgress, scale]);

  // The hold micro-pulse is purely decorative — reduced motion drops it but
  // keeps the size transition above, which is the functional cue the user
  // actually needs to know when to inhale/exhale (Section 15).
  useEffect(() => {
    if (!running || reducedMotion || (phase !== 'hold' && phase !== 'secondHold')) {
      pulse.value = withTiming(1, { duration: 300 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1 + HOLD_PULSE_AMPLITUDE, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [running, reducedMotion, phase, pulse]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value * pulse.value }] }));
  const phaseLabel = usePhaseLabel(phase);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: dashboardColors.accent + '33',
            borderWidth: 2,
            borderColor: dashboardColors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <AppText variant="headingSmall" color={dashboardColors.accent}>
          {running ? phaseLabel : t('meditation.breathing.ready')}
        </AppText>
      </Animated.View>
    </View>
  );
});

BreathingAnimation.displayName = 'BreathingAnimation';
