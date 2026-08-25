import {
  heroGradient,
  fastingHeroGradient,
  activityHeroGradient,
  meditationHeroGradient,
  nutritionHeroGradient,
  statisticsHeroGradient,
  homeHeroGradient,
} from './gradients';

export type SectionKey = 'generic' | 'home' | 'fasting' | 'nutrition' | 'activity' | 'meditation' | 'statistics';

export interface GlowOrbSpec {
  size: number;
  color: string;
  opacity: number;
  pulse?: boolean;
  style: { top?: number; bottom?: number; left?: number; right?: number };
}

export interface SectionEnvironment {
  gradient: readonly [string, string, ...string[]];
  orbs: GlowOrbSpec[];
}

/**
 * Per-section visual atmosphere — the gradient + glow-orb recipe behind
 * `SectionHeroLayout`. `fasting`/`activity`/`meditation`/`generic` values
 * are transcribed verbatim from the hand-duplicated hero layouts they
 * replace, so swapping those layouts onto `SectionHeroLayout` is a lossless
 * refactor. `home`/`nutrition`/`statistics` are new atmospheres for the
 * screens that previously fell back to the generic teal shell.
 */
export const sectionEnvironments: Record<SectionKey, SectionEnvironment> = {
  generic: {
    gradient: heroGradient,
    orbs: [{ size: 340, color: '#0E7A9E', opacity: 0.22, style: { top: -110, right: -90 } }],
  },
  home: {
    gradient: homeHeroGradient,
    orbs: [
      { size: 380, color: '#1BA7D1', opacity: 0.2, pulse: true, style: { top: -130, right: -100 } },
      { size: 300, color: '#0E7A9E', opacity: 0.12, style: { bottom: 120, left: -120 } },
    ],
  },
  fasting: {
    gradient: fastingHeroGradient,
    orbs: [
      { size: 360, color: '#0E7A9E', opacity: 0.24, style: { top: -120, right: -100 } },
      { size: 260, color: '#5B9BD5', opacity: 0.16, style: { bottom: 60, left: -100 } },
    ],
  },
  activity: {
    gradient: activityHeroGradient,
    orbs: [
      { size: 340, color: '#5B9BD5', opacity: 0.22, style: { top: -100, right: -90 } },
      { size: 240, color: '#2C5C87', opacity: 0.2, style: { bottom: 40, left: -100 } },
    ],
  },
  meditation: {
    gradient: meditationHeroGradient,
    orbs: [
      { size: 380, color: '#A78BC9', opacity: 0.26, pulse: true, style: { top: -110, left: -110 } },
      { size: 280, color: '#A78BC9', opacity: 0.18, pulse: true, style: { bottom: 20, right: -90 } },
    ],
  },
  nutrition: {
    gradient: nutritionHeroGradient,
    orbs: [
      { size: 340, color: '#E0AC55', opacity: 0.14, style: { top: -110, right: -90 } },
      { size: 240, color: '#8F6A2E', opacity: 0.16, style: { bottom: 50, left: -100 } },
    ],
  },
  statistics: {
    gradient: statisticsHeroGradient,
    orbs: [
      { size: 340, color: '#1BA7D1', opacity: 0.18, style: { top: -110, right: -90 } },
      { size: 260, color: '#3D77B3', opacity: 0.14, style: { bottom: 40, left: -100 } },
    ],
  },
};
