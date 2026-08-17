import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/common/AppText';
import { BreathingScheme } from '../models';

type Phase = 'inhale' | 'hold' | 'exhale' | 'secondHold';

const PHASE_LABEL: Record<Phase, string> = { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale', secondHold: 'Hold' };

/**
 * Fully data-driven: the phase durations come from a BreathingScheme record
 * (ultimately backend-managed), never hardcoded per-screen.
 */
export const BreathingAnimation: React.FC<{ scheme: BreathingScheme; running: boolean }> = React.memo(({ scheme, running }) => {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0.6)).current;
  const [phase, setPhase] = useState<Phase>('inhale');

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    const allSteps: { phase: Phase; seconds: number; to: number }[] = [
      { phase: 'inhale', seconds: scheme.inhaleSeconds, to: 1 },
      { phase: 'hold', seconds: scheme.holdSeconds, to: 1 },
      { phase: 'exhale', seconds: scheme.exhaleSeconds, to: 0.6 },
      { phase: 'secondHold', seconds: scheme.secondHoldSeconds, to: 0.6 },
    ];
    const sequence = allSteps.filter((s) => s.seconds > 0);

    const runCycle = (index: number) => {
      if (cancelled) return;
      const step = sequence[index % sequence.length];
      setPhase(step.phase);
      Animated.timing(scale, { toValue: step.to, duration: step.seconds * 1000, useNativeDriver: true }).start(() => {
        if (!cancelled) runCycle(index + 1);
      });
    };
    runCycle(0);

    return () => {
      cancelled = true;
      scale.stopAnimation();
    };
  }, [running, scheme, scale]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: theme.colors.meditation + '33',
          borderWidth: 2,
          borderColor: theme.colors.meditation,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <AppText variant="headingSmall" color={theme.colors.meditation}>
          {running ? PHASE_LABEL[phase] : 'Ready'}
        </AppText>
      </Animated.View>
    </View>
  );
});

BreathingAnimation.displayName = 'BreathingAnimation';
