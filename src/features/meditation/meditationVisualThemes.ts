import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Meditation, MeditationTopic, MeditationVisualTheme } from './models';
import { AmbientSoundType } from './ambientSounds';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

/**
 * The concrete presentation values a theme configures on the *existing*
 * Player visuals (GlowOrb, MeditationParticles, AppProgressRing, the
 * breathing visual, the play/pause halo) — never a new visual system, never
 * an image/video asset. `particleDensity` maps to how many of
 * MeditationParticles' fixed particles render, not a different animation.
 */
export interface MeditationVisualThemeConfig {
  accentColor: string;
  glowOpacityIdle: number;
  glowOpacityPlaying: number;
  glowPulse: boolean;
  particleDensity: 'none' | 'few' | 'normal';
}

export const MEDITATION_VISUAL_THEME_CONFIG: Record<MeditationVisualTheme, MeditationVisualThemeConfig> = {
  // Slow warming tone, no harsh yellow/orange — a gentle amber rather than a sunrise-flash.
  sunrise: { accentColor: '#E3A867', glowOpacityIdle: 0.16, glowOpacityPlaying: 0.32, glowPulse: true, particleDensity: 'normal' },
  // Darker, lower-intensity, fewer particles standing in for a subtle star field rather than a gaming-style one.
  night: { accentColor: '#5B72A8', glowOpacityIdle: 0.1, glowOpacityPlaying: 0.2, glowPulse: true, particleDensity: 'few' },
  calm: { accentColor: dashboardColors.accent, glowOpacityIdle: 0.15, glowOpacityPlaying: 0.3, glowPulse: true, particleDensity: 'normal' },
  // Deliberately the most restrained theme — no particles, lower glow, no pulse.
  focus: { accentColor: dashboardColors.accent, glowOpacityIdle: 0.1, glowOpacityPlaying: 0.18, glowPulse: false, particleDensity: 'none' },
  ocean: { accentColor: '#4F94A8', glowOpacityIdle: 0.15, glowOpacityPlaying: 0.3, glowPulse: true, particleDensity: 'normal' },
  forest: { accentColor: '#5F8F6E', glowOpacityIdle: 0.15, glowOpacityPlaying: 0.28, glowPulse: true, particleDensity: 'normal' },
  // Not yet used by BreathingExerciseScreen (Section 25 — no Breathing redesign this phase); present so the theme enum/config is complete and ready.
  breathing: { accentColor: dashboardColors.accent, glowOpacityIdle: 0.14, glowOpacityPlaying: 0.28, glowPulse: true, particleDensity: 'few' },
};

const TOPIC_VISUAL_THEME_DEFAULTS: Record<MeditationTopic, MeditationVisualTheme> = {
  morning: 'sunrise',
  mindfulness: 'calm',
  energy: 'sunrise',
  focus: 'focus',
  relaxation: 'calm',
  calm: 'calm',
  stress_relief: 'forest',
  sleep: 'night',
};

// Only sounds with an obvious visual counterpart get one — 'rain'/'fire' stay
// silent here rather than forcing a mapping that doesn't clearly track a
// theme, per Section 15's "clean primary theme is enough, no blending yet".
const AMBIENT_TYPE_VISUAL_THEME: Partial<Record<AmbientSoundType, MeditationVisualTheme>> = {
  ocean: 'ocean',
  forest: 'forest',
};

/**
 * Priority: explicit content-level override, then active-ambient context,
 * then the topic default. `activeAmbientType` is dormant today — no ambient
 * sound is selectable yet (Section 9) — but the resolver already honors it so
 * wiring a real ambient selection in later needs no Player change.
 */
export function getMeditationVisualTheme(meditation: Pick<Meditation, 'category' | 'visualTheme'> | null | undefined, activeAmbientType?: AmbientSoundType | null): MeditationVisualTheme {
  if (meditation?.visualTheme) return meditation.visualTheme;
  if (activeAmbientType) {
    const ambientTheme = AMBIENT_TYPE_VISUAL_THEME[activeAmbientType];
    if (ambientTheme) return ambientTheme;
  }
  if (meditation?.category) return TOPIC_VISUAL_THEME_DEFAULTS[meditation.category];
  return 'calm';
}

export function getMeditationVisualThemeConfig(meditation: Pick<Meditation, 'category' | 'visualTheme'> | null | undefined, activeAmbientType?: AmbientSoundType | null): MeditationVisualThemeConfig {
  return MEDITATION_VISUAL_THEME_CONFIG[getMeditationVisualTheme(meditation, activeAmbientType)];
}

/** Section 23 — reduces/stops particles and pulsing without going visually empty; the ring, gradient and static layout are untouched. */
export function applyReducedMotion(config: MeditationVisualThemeConfig, reducedMotion: boolean): MeditationVisualThemeConfig {
  if (!reducedMotion) return config;
  return { ...config, glowPulse: false, particleDensity: 'none' };
}

/** Thin wrapper over the OS-level reduced-motion accessibility setting, live-updating if the user changes it while the screen is open. */
export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
