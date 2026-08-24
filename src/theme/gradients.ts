/**
 * Longlivy gradient tokens.
 *
 * These sit alongside (not instead of) the flat color tokens in `colors.ts` —
 * most of the app stays on flat surfaces, but "moment" screens (onboarding
 * hero, fasting/meditation atmosphere, premium CTAs) use these for the
 * premium, modern-tech-meets-lifestyle feel described in the design brief.
 *
 * Charcoal/graphite direction, refined: hero backgrounds carry a subtle
 * blue-black undertone now instead of being perfectly neutral, and the
 * single bold accent is a deep cobalt-teal (matches `colors.ts`'s `primary`)
 * rather than the earlier bright mint — depth and mood still come primarily
 * from per-pillar undertones and restrained glow, not from switching brand
 * hues.
 */

/** Deep, atmospheric hero background — used regardless of light/dark theme preference on "moment" screens (Welcome, feature intros). */
export const heroGradient = ['#08090C', '#101319', '#181C24'] as const;

/** Slightly lighter variant for hero cards/panels sitting on top of `heroGradient`. */
export const heroPanelGradient = ['#181B24', '#1E212C'] as const;

/** Bold cobalt-teal glow accent — the app's one saturated accent, used sparingly for CTA glow / highlight moments. */
export const accentGlow = ['#5FE0FF', '#1BA7D1'] as const;

/** Primary CTA gradient — the bold accent deepening, used on the hero gradient buttons. */
export const ctaGradient = ['#1BA7D1', '#0E7A9E'] as const;

/** Per-pillar gradients for the "What is Longlivy" pillar intro — pairs with `colors.ts`'s flat fasting/nutrition/activity/meditation tokens. */
export const pillarGradients = {
  fasting: ['#0E7A9E', '#1BA7D1'],
  nutrition: ['#8F6A2E', '#E0AC55'],
  activity: ['#2C5C87', '#5B9BD5'],
  meditation: ['#453569', '#A78BC9'],
} as const;

export type PillarKey = keyof typeof pillarGradients;

/**
 * A distinct dark atmosphere for the fasting "moment" screens (active fast,
 * start-fasting confirmation) — deliberately not identical to `heroGradient`.
 * Same blue-black base as the other hero moods, with just enough
 * cobalt-teal undertone to read as "fasting" next to activity's blue and
 * meditation's violet.
 */
export const fastingHeroGradient = ['#070A0C', '#0C161A', '#112129'] as const;

/**
 * A distinct dark atmosphere for the activity "live tracking" screens
 * (active workout, post-workout summary) — same charcoal base, subtle
 * blue undertone for the kinetic, in-motion feel a workout session should
 * have next to fasting's calmer "lab" read.
 */
export const activityHeroGradient = ['#08090B', '#0F1620', '#161F2C'] as const;

/**
 * A distinct dark atmosphere for meditation's "live session" screens
 * (player, breathing exercise) — same charcoal base, subtle violet
 * undertone, paired with GlowOrb's `pulse` option (a slow breathing
 * opacity cycle) rather than the sharper glows used elsewhere.
 */
export const meditationHeroGradient = ['#09080B', '#151220', '#1E1830'] as const;

/** Energy-source colors for the fasting energy-mix visualization — shared between the visualization and its legend. */
export const energySourceColors = {
  lastMeal: '#E0AC55',
  glycogen: '#5B9BD5',
  fat: '#1BA7D1',
  ketones: '#A78BC9',
} as const;
