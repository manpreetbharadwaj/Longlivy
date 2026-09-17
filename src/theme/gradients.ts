/**
 * Longlivy gradient tokens.
 *
 * These sit alongside (not instead of) the flat color tokens in `colors.ts` —
 * most of the app stays on flat surfaces, but "moment" screens (onboarding
 * hero, fasting/meditation atmosphere, premium CTAs) use these for the
 * premium, modern-tech-meets-lifestyle feel described in the design brief.
 *
 * v5 premium-neutral pass: hero backgrounds are now closer to true neutral
 * charcoal (a faint undertone per pillar, not a blue-black wash everywhere),
 * and the single "bold accent glow" is gone — every accent below is a
 * muted, desaturated tone in its own pillar family rather than one shared
 * neon cobalt-teal. See `colors.ts`'s v5 note for the full rationale.
 */

/** Deep, sophisticated neutral hero background — used regardless of light/dark theme preference on "moment" screens (Welcome, feature intros). */
export const heroGradient = ['#08080A', '#0F0F11', '#17171A'] as const;

/** Slightly lighter variant for hero cards/panels sitting on top of `heroGradient`. */
export const heroPanelGradient = ['#17171A', '#1D1D21'] as const;

/** Muted steel-blue glow accent — restrained (no longer neon cyan), used sparingly for CTA glow / highlight moments. */
export const accentGlow = ['#7A97B0', '#3D5266'] as const;

/** Primary CTA gradient — the muted steel accent deepening, used on the hero gradient buttons. */
export const ctaGradient = ['#5C7A94', '#3D5266'] as const;

/** Per-pillar gradients for the "What is Longlivy" pillar intro — pairs with `colors.ts`'s flat fasting/nutrition/activity/meditation tokens. */
export const pillarGradients = {
  fasting: ['#564B6E', '#8B7FA8'],
  nutrition: ['#8A6635', '#C9974E'],
  activity: ['#3D5266', '#6E8FAE'],
  meditation: ['#4A6047', '#7A9B76'],
} as const;

export type PillarKey = keyof typeof pillarGradients;

/**
 * A distinct dark atmosphere for the fasting "moment" screens (active fast,
 * start-fasting confirmation) — deliberately not identical to `heroGradient`.
 * Muted violet undertone — fasting now owns the restrained "scientific /
 * biological" pillar mood, distinct from nutrition's warm bronze and
 * meditation's sage.
 */
export const fastingHeroGradient = ['#09080B', '#100D16', '#181420'] as const;

/**
 * A distinct dark atmosphere for the activity "live tracking" screens
 * (active workout, post-workout summary) — same charcoal base, a restrained
 * steel-blue undertone for the kinetic, in-motion feel a workout session
 * should have next to fasting's warm read and meditation's lavender one.
 */
export const activityHeroGradient = ['#08090A', '#0E141C', '#141B26'] as const;

/**
 * A distinct dark atmosphere for the nutrition dashboard — same charcoal
 * base as the other hero moods, with a warm amber undertone (pairs with
 * `colors.ts`'s nutrition tone `#C9974E`) so logging food reads as fresh
 * and energetic next to fasting's restrained violet and meditation's sage.
 */
export const nutritionHeroGradient = ['#0A0806', '#160F09', '#211710'] as const;

/**
 * A distinct dark atmosphere for the statistics screen — same charcoal
 * base, muted teal undertone for an analytical, data-driven feel distinct
 * from the other pillar moods.
 */
export const statisticsHeroGradient = ['#06090A', '#0C1615', '#12211F'] as const;

/**
 * A distinct dark atmosphere for meditation screens — muted sage undertone
 * (pairs with `colors.ts`'s meditation tone `#7A9B76`), its own calm/natural
 * mood rather than borrowing home's neutral atmosphere.
 */
export const meditationHeroGradient = ['#070A08', '#0D1712', '#13221B'] as const;

/**
 * The Home dashboard's atmosphere — neutral deep charcoal with the
 * faintest cool-gray undertone, deliberately restrained since Home
 * aggregates every section rather than belonging to one of them.
 */
export const homeHeroGradient = ['#07070A', '#0D0D11', '#141417'] as const;

/** Energy-source colors for the fasting energy-mix visualization — shared between the visualization and its legend. */
export const energySourceColors = {
  lastMeal: '#C9974E',
  glycogen: '#6E8FAE',
  fat: '#3D5266',
  ketones: '#8B7FA8',
} as const;
