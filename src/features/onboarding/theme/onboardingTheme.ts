/**
 * Onboarding's own visual system — deliberately separate from `@/theme/gradients`
 * so onboarding's atmosphere can stay a touch more cinematic than the app's
 * everyday screens, but built from the *same* accent family so the two
 * never read as two different products.
 *
 * Matches the app-wide "Warm Ink & Jade" identity: the base gradient is a
 * warm espresso neutral, `onboardingAccent` is the brand jade (not a
 * borrowed blue), and `onboardingNeutral` stays a warm taupe for
 * decorative icon tiles/preview rows that aren't a primary action — so the
 * one bold accent color doesn't end up on every element on screen at once.
 */

/** Base atmosphere for every onboarding screen — warm espresso, matching the app-wide hero gradient. */
export const onboardingGradient = ['#0E0C09', '#161310', '#1E1A15'] as const;

/** Slightly lifted panel tone for glass surfaces sitting on top of the base gradient. */
export const onboardingPanelGradient = ['#1E1A15', '#262019'] as const;

/** The one bold accent — brand jade, matching the app's `primary` token. Reserved for things that genuinely need to stand out: the primary CTA, a selected state, a data highlight — not every icon/border in the flow (see `onboardingNeutral` for those). */
export const onboardingAccent = '#4FAE8F';
/** Deeper stop for the accent gradient — keeps the CTA from reading as a flat sticker. */
export const onboardingAccentDeep = '#1F6F5C';
/** A lighter tint of the same accent hue — reserved for numeric/data moments (ruler pickers, calorie count-up) so it reads as "your data, in focus" rather than a second, unrelated brand color. */
export const onboardingData = '#6FCBAA';

/** Warm taupe — the default tone for decorative icon tiles, badges and preview rows that aren't a primary action or a live selection. */
export const onboardingNeutral = '#A89A80';
/** A softer, deeper taupe — for a neutral tile's background wash where `onboardingNeutral` itself is used for the border/icon (mirrors how `onboardingAccent` pairs with its own `22`/`55` alpha washes). */
export const onboardingNeutralDeep = '#786B54';

export const onboardingCtaGradient = [onboardingAccent, onboardingAccentDeep] as const;
export const onboardingGlow = [onboardingAccent, onboardingAccentDeep] as const;

/** Glass-surface tokens shared by every onboarding component (cards, inputs, chips). */
export const onboardingGlass = {
  fill: 'rgba(255,247,232,0.05)',
  fillSelected: 'rgba(79,174,143,0.18)',
  border: 'rgba(255,247,232,0.12)',
  borderSelected: onboardingAccent,
  textPrimary: '#F6EFE2',
  textSecondary: 'rgba(246,239,226,0.62)',
  textTertiary: 'rgba(246,239,226,0.4)',
} as const;

/** Per-pillar accent used only on the Value screen's showcase deck — matches the same reassigned per-pillar colors used everywhere else in the app (`@/theme/colors.ts`): fasting indigo, nutrition golden ochre, activity terracotta, meditation dusty plum. */
export const onboardingPillarColors = {
  fasting: '#6E8DBE',
  nutrition: '#D6A253',
  activity: '#D98657',
  meditation: '#A186BD',
} as const;

export type PillarKey = keyof typeof onboardingPillarColors;

/** Goal-card accents — one per outcome, each with a matching gradient for its sparkline. */
export const onboardingGoalColors = {
  weight_loss: { accent: '#4FAE8F', gradient: ['#6FCBAA', '#1F6F5C'] as const },
  maintenance: { accent: '#6E8DBE', gradient: ['#8FA8D2', '#3E5A8C'] as const },
  muscle_gain: { accent: '#D6A253', gradient: ['#E2BA7C', '#8C6423'] as const },
} as const;

/** Gender-glyph accents for the Gender step — icon-only color identity (the card itself stays neutral), same restrained/desaturated family as everything else in onboarding rather than literal blue/pink. */
export const onboardingGenderColors = {
  male: '#6E8DBE',
  female: '#C48F94',
  diverse: '#A186BD',
} as const;
