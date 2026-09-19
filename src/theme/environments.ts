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
 * `SectionHeroLayout`.
 *
 * v5 premium-neutral pass: every section now gets its own restrained,
 * desaturated accent instead of sharing one bright cobalt-teal. Orb
 * opacities are also turned down across the board — the old values
 * (0.12-0.24) read as a glow sitting on every screen; 0.07-0.16 keeps the
 * same sense of depth/atmosphere without the neon-lit feel.
 *
 * v6 section-identity pass: reassigned which pillar owns which hue so the
 * color matches the section's *character* — activity stays steel blue
 * (energetic/performance), nutrition -> warm amber (fresh/informative),
 * meditation -> sage green (calm/natural), fasting -> muted violet (a
 * restrained "scientific/biological" accent), statistics -> muted teal,
 * home -> a barely-there neutral blue-gray.
 */
export const sectionEnvironments: Record<SectionKey, SectionEnvironment> = {
  generic: {
    gradient: heroGradient,
    orbs: [{ size: 340, color: '#3D5266', opacity: 0.12, style: { top: -110, right: -90 } }],
  },
  home: {
    gradient: homeHeroGradient,
    orbs: [
      { size: 380, color: '#5C6B78', opacity: 0.12, pulse: true, style: { top: -130, right: -100 } },
      { size: 300, color: '#3D5266', opacity: 0.08, style: { bottom: 120, left: -120 } },
    ],
  },
  fasting: {
    gradient: fastingHeroGradient,
    orbs: [
      { size: 360, color: '#8B7FA8', opacity: 0.16, style: { top: -120, right: -100 } },
      { size: 260, color: '#564B6E', opacity: 0.12, style: { bottom: 60, left: -100 } },
    ],
  },
  activity: {
    gradient: activityHeroGradient,
    orbs: [
      { size: 340, color: '#6E8FAE', opacity: 0.14, style: { top: -100, right: -90 } },
      { size: 240, color: '#3D5266', opacity: 0.12, style: { bottom: 40, left: -100 } },
    ],
  },
  nutrition: {
    gradient: nutritionHeroGradient,
    orbs: [
      { size: 340, color: '#C9974E', opacity: 0.12, style: { top: -110, right: -90 } },
      { size: 240, color: '#8A6635', opacity: 0.12, style: { bottom: 50, left: -100 } },
    ],
  },
  meditation: {
    gradient: meditationHeroGradient,
    orbs: [
      { size: 360, color: '#7A9B76', opacity: 0.14, style: { top: -120, right: -100 } },
      { size: 260, color: '#4A6047', opacity: 0.1, style: { bottom: 60, left: -100 } },
    ],
  },
  statistics: {
    gradient: statisticsHeroGradient,
    orbs: [
      { size: 340, color: '#5C9494', opacity: 0.14, style: { top: -110, right: -90 } },
      { size: 260, color: '#2E4F4F', opacity: 0.1, style: { bottom: 40, left: -100 } },
    ],
  },
};
