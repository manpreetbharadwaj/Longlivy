/**
 * Solace gradient tokens.
 *
 * These sit alongside (not instead of) the flat color tokens in `colors.ts`
 * — most of the app stays on flat surfaces, but "moment" screens
 * (onboarding hero, fasting/meditation atmosphere, premium CTAs) use these
 * for a warmer, more atmospheric feel than a flat surface alone gives.
 *
 * Every hero background here is a warm ink/espresso neutral (not a cool
 * charcoal), and the CTA/glow accent is the brand's jade rather than a
 * blue. Per-pillar undertones follow `colors.ts`'s reassigned mapping:
 * fasting → indigo, activity → terracotta, nutrition → golden ochre,
 * meditation → dusty plum.
 */

/** Deep, warm ink hero background — used regardless of light/dark theme preference on "moment" screens (Welcome, feature intros). */
export const heroGradient = ['#0E0C09', '#161310', '#1E1A15'] as const;

/** Slightly lighter variant for hero cards/panels sitting on top of `heroGradient`. */
export const heroPanelGradient = ['#1E1A15', '#262019'] as const;

/** Brand jade glow accent — used sparingly for CTA glow / highlight moments. */
export const accentGlow = ['#6FCBAA', '#1F6F5C'] as const;

/** Primary CTA gradient — the brand jade deepening, used on hero gradient buttons and the floating tab bar's center action. */
export const ctaGradient = ['#4FAE8F', '#1F6F5C'] as const;

/** Per-pillar gradients for the "What is Solace" pillar intro — pairs with `colors.ts`'s flat fasting/nutrition/activity/meditation tokens. */
export const pillarGradients = {
  fasting: ['#4A6491', '#2C3F5C'],
  nutrition: ['#D6A253', '#8C6423'],
  activity: ['#D98657', '#8C4620'],
  meditation: ['#A186BD', '#59416E'],
} as const;

export type PillarKey = keyof typeof pillarGradients;

/** A distinct dark atmosphere for the fasting "moment" screens (active fast, start-fasting confirmation) — an indigo undertone, distinct from nutrition's ochre and meditation's plum. */
export const fastingHeroGradient = ['#0A0C10', '#11151E', '#171C29'] as const;

/** A distinct dark atmosphere for the activity "live tracking" screens (active workout, post-workout summary) — a terracotta undertone for the kinetic, in-motion feel a workout session should have. */
export const activityHeroGradient = ['#0F0A07', '#1C120A', '#28190E'] as const;

/** A distinct dark atmosphere for the nutrition dashboard — a golden-ochre undertone so logging food reads as warm and nourishing. */
export const nutritionHeroGradient = ['#0F0C06', '#1D160A', '#2A200E'] as const;

/** A distinct dark atmosphere for the statistics/progress screen — a teal undertone for an analytical, data-driven feel. */
export const statisticsHeroGradient = ['#070C0B', '#0E1917', '#142320'] as const;

/** A distinct dark atmosphere for meditation screens — a dusty-plum undertone, its own calm mood distinct from the brand's jade. */
export const meditationHeroGradient = ['#0B090D', '#171220', '#221A2E'] as const;

/** The Home dashboard's atmosphere — neutral warm ink, deliberately restrained since Home aggregates every section rather than belonging to one of them. */
export const homeHeroGradient = ['#0C0A08', '#14110D', '#1B1712'] as const;

/** Energy-source colors for the fasting energy-mix visualization — shared between the visualization and its legend. */
export const energySourceColors = {
  lastMeal: '#D6A253',
  glycogen: '#6E8DBE',
  fat: '#1F6F5C',
  ketones: '#A186BD',
} as const;
