/**
 * HealthyMe gradient tokens.
 *
 * These sit alongside (not instead of) the flat color tokens in `colors.ts`
 * — most of the app stays on flat dark-navy surfaces, but "moment" screens
 * (onboarding hero, fasting/meditation atmosphere, premium CTAs) use these
 * for a deeper, more atmospheric feel than a flat surface alone gives.
 *
 * Every hero background here is a deep navy/near-black (not a warm ink),
 * and the CTA/glow accent is the brand's cyan rather than jade. Per-pillar
 * undertones follow `colors.ts`'s mapping: fasting → indigo, activity →
 * coral, nutrition → amber, meditation → violet.
 */

/** Deep navy hero background — used regardless of light/dark theme preference on "moment" screens (Welcome, feature intros). */
export const heroGradient = ['#05080B', '#0A1218', '#0F1B22'] as const;

/** Slightly lighter variant for hero cards/panels sitting on top of `heroGradient`. */
export const heroPanelGradient = ['#0F1B22', '#16242C'] as const;

/** Brand cyan glow accent — used sparingly for CTA glow / highlight moments. */
export const accentGlow = ['#67E8F9', '#0E9BB5'] as const;

/** Primary CTA gradient — the brand cyan deepening, used on hero gradient buttons and the floating tab bar's center action. */
export const ctaGradient = ['#22D3EE', '#0E9BB5'] as const;

/** Per-pillar gradients for the "What is HealthyMe" pillar intro — pairs with `colors.ts`'s flat fasting/nutrition/activity/meditation tokens. */
export const pillarGradients = {
  fasting: ['#7C93F0', '#3B4A9E'],
  nutrition: ['#F5A94E', '#A2650F'],
  activity: ['#FF7A63', '#B23A26'],
  meditation: ['#B79AF5', '#6641B8'],
} as const;

export type PillarKey = keyof typeof pillarGradients;

/** A distinct dark atmosphere for the fasting "moment" screens (active fast, start-fasting confirmation) — an indigo undertone, distinct from nutrition's amber and meditation's violet. */
export const fastingHeroGradient = ['#05070C', '#0A0E1C', '#111A2E'] as const;

/** A distinct dark atmosphere for the activity "live tracking" screens (active workout, post-workout summary) — a coral undertone for the kinetic, in-motion feel a workout session should have. */
export const activityHeroGradient = ['#0A0607', '#1C0E0A', '#2A140D'] as const;

/** A distinct dark atmosphere for the nutrition dashboard — a warm-amber undertone so logging food reads as nourishing against the cool brand base. */
export const nutritionHeroGradient = ['#0A0805', '#1C140A', '#2A1C0E'] as const;

/** A distinct dark atmosphere for the statistics/progress screen — a cyan/teal undertone for an analytical, data-driven feel, closest to the brand's own atmosphere. */
export const statisticsHeroGradient = ['#04090A', '#081A1D', '#0D2A2E'] as const;

/** A distinct dark atmosphere for meditation screens — a soft-violet undertone, its own calm mood distinct from the brand's cyan. */
export const meditationHeroGradient = ['#07060B', '#130F20', '#1C1530'] as const;

/** The Home dashboard's atmosphere — the brand's own deep navy, deliberately restrained since Home aggregates every section rather than belonging to one of them. */
export const homeHeroGradient = ['#05080B', '#0A1218', '#0F1B22'] as const;

/** Energy-source colors for the fasting energy-mix visualization — shared between the visualization and its legend. */
export const energySourceColors = {
  lastMeal: '#F5A94E',
  glycogen: '#7C93F0',
  fat: '#22D3EE',
  ketones: '#B79AF5',
} as const;
