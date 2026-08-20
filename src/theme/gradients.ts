/**
 * Longlivy gradient tokens.
 *
 * These sit alongside (not instead of) the flat color tokens in `colors.ts` —
 * most of the app stays on flat surfaces, but "moment" screens (onboarding
 * hero, fasting/meditation atmosphere, premium CTAs) use these for the
 * premium, modern-tech-meets-lifestyle feel described in the design brief.
 *
 * Kept deliberately dark and brand-anchored (deep forest teal, the existing
 * `primary`) rather than borrowing another app's palette wholesale — the
 * futuristic/biohacking read comes from depth + glow + motion, not from
 * switching brand colors.
 */

/** Deep, atmospheric hero background — used regardless of light/dark theme preference on "moment" screens (Welcome, feature intros). */
export const heroGradient = ['#03100D', '#0A2B26', '#0F4A42'] as const;

/** Slightly lighter variant for hero cards/panels sitting on top of `heroGradient`. */
export const heroPanelGradient = ['#0F3D37', '#123F38'] as const;

/** Warm glow accent — echoes the existing `secondary` amber, used sparingly for CTA glow / highlight moments. */
export const accentGlow = ['#F2B679', '#D98E4A'] as const;

/** Primary CTA gradient — brand teal deepening, used on the hero gradient buttons. */
export const ctaGradient = ['#1FA391', '#0B4F4A'] as const;

/** Per-pillar gradients for the "What is Longlivy" pillar intro — pairs with `colors.ts`'s flat fasting/nutrition/activity/meditation tokens. */
export const pillarGradients = {
  fasting: ['#0F4A42', '#1FA391'],
  nutrition: ['#B4652A', '#E7A868'],
  activity: ['#1F4E7A', '#5C9BD9'],
  meditation: ['#4A3A7A', '#9B7FD9'],
} as const;

export type PillarKey = keyof typeof pillarGradients;

/**
 * A distinct dark atmosphere for the fasting "moment" screens (active fast,
 * start-fasting confirmation) — deliberately not identical to `heroGradient`.
 * The design brief asked for fasting to feel "dynamic, motivating,
 * scientific" as its own mood, separate from onboarding's "premium arrival"
 * feel: cooler, more cyan-forward, closer to a data/lab aesthetic.
 */
export const fastingHeroGradient = ['#020D14', '#062430', '#0B3A44'] as const;

/**
 * A distinct dark atmosphere for the activity "live tracking" screens
 * (active workout, post-workout summary) — its own mood again, separate
 * from both `heroGradient` and `fastingHeroGradient`: deep navy deepening
 * into the existing `pillarGradients.activity` blue, for the kinetic,
 * in-motion feel a workout session should have next to fasting's calmer
 * "lab" read.
 */
export const activityHeroGradient = ['#04070F', '#0B2140', '#123A5C'] as const;

/** Energy-source colors for the fasting energy-mix visualization — shared between the visualization and its legend. */
export const energySourceColors = {
  lastMeal: '#E7A868',
  glycogen: '#6AA3DE',
  fat: '#1FA391',
  ketones: '#B98CE0',
} as const;
