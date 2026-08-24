/**
 * Onboarding's own visual system — deliberately separate from `@/theme/gradients`
 * so onboarding's atmosphere can stay a touch more cinematic than the app's
 * everyday screens, but built from the *same* accent family so the two
 * never read as two different products.
 *
 * Refined palette: the base gradient is a blue-black (matching the rest of
 * the app's new undertone) rather than the earlier navy-violet, and the
 * accent is the same deep cobalt-teal as `colors.ts`'s `primary` instead of
 * the earlier electric indigo — no purple left anywhere in the flow. A
 * lighter tint of that same hue (`onboardingData`) still exists for
 * numeric/data moments (ruler pickers, the calibration count-up), so "your
 * data" reads as a brighter echo of the one accent, not a second unrelated
 * color.
 */

/** Base atmosphere for every onboarding screen — near-black to deep blue-black, matching the rest of the app's undertone. */
export const onboardingGradient = ['#050609', '#0B0E15', '#131720'] as const;

/** Slightly lifted panel tone for glass surfaces sitting on top of the base gradient. */
export const onboardingPanelGradient = ['#12151D', '#181C26'] as const;

/** The one bold accent — deep cobalt-teal, matching the app's `primary` token. Carries selection state, focus rings and the primary CTA. */
export const onboardingAccent = '#1BA7D1';
/** Deeper stop for the accent gradient — keeps the CTA from reading as a flat sticker. */
export const onboardingAccentDeep = '#0E7A9E';
/** A brighter tint of the same accent hue — reserved for numeric/data moments (ruler pickers, calorie count-up) so it reads as "your data, in focus" rather than a second, unrelated brand color. */
export const onboardingData = '#5FE0FF';

export const onboardingCtaGradient = [onboardingAccent, onboardingAccentDeep] as const;
export const onboardingGlow = [onboardingAccent, onboardingAccentDeep] as const;

/** Glass-surface tokens shared by every onboarding component (cards, inputs, chips). */
export const onboardingGlass = {
  fill: 'rgba(255,255,255,0.05)',
  fillSelected: 'rgba(27,167,209,0.16)',
  border: 'rgba(255,255,255,0.12)',
  borderSelected: onboardingAccent,
  textPrimary: '#F3F5F8',
  textSecondary: 'rgba(243,245,248,0.62)',
  textTertiary: 'rgba(243,245,248,0.4)',
} as const;

/** Per-pillar accent used only on the Value screen's showcase deck — fasting matches the app's one accent (it's the core pillar); the others stay the same muted category colors used everywhere else in the app. */
export const onboardingPillarColors = {
  fasting: '#1BA7D1',
  nutrition: '#E0A94E',
  activity: '#4E9CE8',
  meditation: '#A78BC9',
} as const;

/** Goal-card accents — one per outcome, each with a matching gradient for its sparkline. */
export const onboardingGoalColors = {
  weight_loss: { accent: '#1BA7D1', gradient: ['#5FE0FF', '#0E7A9E'] as const },
  maintenance: { accent: '#5FE0FF', gradient: ['#8FE9FF', '#1BA7D1'] as const },
  muscle_gain: { accent: '#E0A94E', gradient: ['#F0C275', '#C4862F'] as const },
} as const;
