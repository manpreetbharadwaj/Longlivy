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
 * `SectionHeroLayout`. Orb colors follow `colors.ts`'s pillar mapping:
 * fasting → indigo, activity → coral, nutrition → amber, meditation →
 * violet, statistics/progress → teal, home → a barely-there cool neutral
 * (it aggregates every section, so it shouldn't lean toward any one
 * pillar's hue).
 */
export const sectionEnvironments: Record<SectionKey, SectionEnvironment> = {
  generic: {
    gradient: heroGradient,
    orbs: [{ size: 340, color: '#22D3EE', opacity: 0.12, style: { top: -110, right: -90 } }],
  },
  home: {
    gradient: homeHeroGradient,
    orbs: [
      { size: 380, color: '#4A6572', opacity: 0.12, pulse: true, style: { top: -130, right: -100 } },
      { size: 300, color: '#22D3EE', opacity: 0.08, style: { bottom: 120, left: -120 } },
    ],
  },
  fasting: {
    gradient: fastingHeroGradient,
    orbs: [
      { size: 360, color: '#7C93F0', opacity: 0.16, style: { top: -120, right: -100 } },
      { size: 260, color: '#3B4A9E', opacity: 0.12, style: { bottom: 60, left: -100 } },
    ],
  },
  activity: {
    gradient: activityHeroGradient,
    orbs: [
      { size: 340, color: '#FF7A63', opacity: 0.14, style: { top: -100, right: -90 } },
      { size: 240, color: '#B23A26', opacity: 0.12, style: { bottom: 40, left: -100 } },
    ],
  },
  nutrition: {
    gradient: nutritionHeroGradient,
    orbs: [
      { size: 340, color: '#F5A94E', opacity: 0.12, style: { top: -110, right: -90 } },
      { size: 240, color: '#A2650F', opacity: 0.12, style: { bottom: 50, left: -100 } },
    ],
  },
  meditation: {
    gradient: meditationHeroGradient,
    orbs: [
      { size: 360, color: '#B79AF5', opacity: 0.14, style: { top: -120, right: -100 } },
      { size: 260, color: '#6641B8', opacity: 0.1, style: { bottom: 60, left: -100 } },
    ],
  },
  statistics: {
    gradient: statisticsHeroGradient,
    orbs: [
      { size: 340, color: '#2DD4BF', opacity: 0.14, style: { top: -110, right: -90 } },
      { size: 260, color: '#0F6B62', opacity: 0.1, style: { bottom: 40, left: -100 } },
    ],
  },
};
