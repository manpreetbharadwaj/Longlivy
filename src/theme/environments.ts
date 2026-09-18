import {
  heroGradient,
  fastingHeroGradient,
  activityHeroGradient,
  nutritionHeroGradient,
  statisticsHeroGradient,
  meditationHeroGradient,
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
 * `SectionHeroLayout`. Orb colors follow `colors.ts`'s pillar reassignment:
 * fasting → indigo, activity → terracotta, nutrition → golden ochre,
 * meditation → dusty plum, statistics/progress → teal, home → a barely-there
 * warm neutral (it aggregates every section, so it shouldn't lean toward
 * any one pillar's hue).
 */
export const sectionEnvironments: Record<SectionKey, SectionEnvironment> = {
  generic: {
    gradient: heroGradient,
    orbs: [{ size: 340, color: '#4FAE8F', opacity: 0.12, style: { top: -110, right: -90 } }],
  },
  home: {
    gradient: homeHeroGradient,
    orbs: [
      { size: 380, color: '#8A7C68', opacity: 0.12, pulse: true, style: { top: -130, right: -100 } },
      { size: 300, color: '#4FAE8F', opacity: 0.08, style: { bottom: 120, left: -120 } },
    ],
  },
  fasting: {
    gradient: fastingHeroGradient,
    orbs: [
      { size: 360, color: '#6E8DBE', opacity: 0.16, style: { top: -120, right: -100 } },
      { size: 260, color: '#2C3F5C', opacity: 0.12, style: { bottom: 60, left: -100 } },
    ],
  },
  activity: {
    gradient: activityHeroGradient,
    orbs: [
      { size: 340, color: '#D98657', opacity: 0.14, style: { top: -100, right: -90 } },
      { size: 240, color: '#8C4620', opacity: 0.12, style: { bottom: 40, left: -100 } },
    ],
  },
  nutrition: {
    gradient: nutritionHeroGradient,
    orbs: [
      { size: 340, color: '#D6A253', opacity: 0.12, style: { top: -110, right: -90 } },
      { size: 240, color: '#8C6423', opacity: 0.12, style: { bottom: 50, left: -100 } },
    ],
  },
  meditation: {
    gradient: meditationHeroGradient,
    orbs: [
      { size: 360, color: '#A186BD', opacity: 0.14, style: { top: -120, right: -100 } },
      { size: 260, color: '#59416E', opacity: 0.1, style: { bottom: 60, left: -100 } },
    ],
  },
  statistics: {
    gradient: statisticsHeroGradient,
    orbs: [
      { size: 340, color: '#4FA3A3', opacity: 0.14, style: { top: -110, right: -90 } },
      { size: 260, color: '#215050', opacity: 0.1, style: { bottom: 40, left: -100 } },
    ],
  },
};
