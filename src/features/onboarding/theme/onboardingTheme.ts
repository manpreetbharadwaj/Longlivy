/**
 * Onboarding's own visual system — deliberately separate from `@/theme/gradients`
 * so onboarding's atmosphere can stay a touch more cinematic than the app's
 * everyday screens, but built from the *same* accent family so the two
 * never read as two different products.
 *
 * v6 warm-neutral pass: v5 fixed the neon-blue problem but, in practice,
 * every icon/border/badge across onboarding still defaulted to the one
 * blue accent because it was the only non-white color exported here — blue
 * ended up dominating anyway, just a muted blue instead of a bright one.
 * v6 keeps `onboardingAccent` for what actually needs it (the primary CTA,
 * selected states, data highlights) and adds `onboardingNeutral` — a warm
 * taupe/graphite tone — as the default for decorative icon tiles and
 * "preview" content that isn't a primary action. The base gradient also
 * picked up a faint warm undertone (was a colder true-neutral charcoal),
 * so the whole flow reads as warm/premium rather than cold/technical.
 */

/** Base atmosphere for every onboarding screen — near-black with a faint warm undertone (not a cold neutral, not blue-black). */
export const onboardingGradient = ['#0A0908', '#100E0C', '#19160F'] as const;

/** Slightly lifted panel tone for glass surfaces sitting on top of the base gradient. */
export const onboardingPanelGradient = ['#19160F', '#201C15'] as const;

/** The one bold accent — muted steel blue, matching the app's `primary` token. Reserved for things that genuinely need to stand out: the primary CTA, a selected state, a data highlight — not every icon/border in the flow (see `onboardingNeutral` for those). */
export const onboardingAccent = '#5C7A94';
/** Deeper stop for the accent gradient — keeps the CTA from reading as a flat sticker. */
export const onboardingAccentDeep = '#3D5266';
/** A lighter tint of the same accent hue — reserved for numeric/data moments (ruler pickers, calorie count-up) so it reads as "your data, in focus" rather than a second, unrelated brand color. Muted, not neon. */
export const onboardingData = '#7A97B0';

/** Warm taupe/graphite — the default tone for decorative icon tiles, badges and preview rows that aren't a primary action or a live selection, so blue doesn't end up on every element on screen simultaneously. */
export const onboardingNeutral = '#9A9186';
/** A softer, deeper taupe — for a neutral tile's background wash where `onboardingNeutral` itself is used for the border/icon (mirrors how `onboardingAccent` pairs with its own `22`/`55` alpha washes). */
export const onboardingNeutralDeep = '#6B6459';

export const onboardingCtaGradient = [onboardingAccent, onboardingAccentDeep] as const;
export const onboardingGlow = [onboardingAccent, onboardingAccentDeep] as const;

/** Glass-surface tokens shared by every onboarding component (cards, inputs, chips). */
export const onboardingGlass = {
  fill: 'rgba(255,255,255,0.05)',
  fillSelected: 'rgba(92,122,148,0.18)',
  border: 'rgba(255,255,255,0.12)',
  borderSelected: onboardingAccent,
  textPrimary: '#F2F1EE',
  textSecondary: 'rgba(242,241,238,0.62)',
  textTertiary: 'rgba(242,241,238,0.4)',
} as const;

/** Per-pillar accent used only on the Value screen's showcase deck — matches the same restrained per-pillar colors used everywhere else in the app (`@/theme/colors.ts`): activity steel blue, nutrition warm amber, meditation sage, fasting muted violet. */
export const onboardingPillarColors = {
  fasting: '#8B7FA8',
  nutrition: '#C9974E',
  activity: '#6E8FAE',
  meditation: '#7A9B76',
} as const;

export type PillarKey = keyof typeof onboardingPillarColors;

/** Goal-card accents — one per outcome, each with a matching gradient for its sparkline. Same muted steel/bronze family as the rest of onboarding, differentiated by tone rather than by switching to a bright/neon hue. */
export const onboardingGoalColors = {
  weight_loss: { accent: '#5C7A94', gradient: ['#7A97B0', '#3D5266'] as const },
  maintenance: { accent: '#7A97B0', gradient: ['#9CB4C8', '#5C7A94'] as const },
  muscle_gain: { accent: '#C9974E', gradient: ['#D9AD6C', '#A97A3E'] as const },
} as const;

/** Gender-glyph accents for the Gender step — icon-only color identity (the card itself stays neutral), same restrained/desaturated family as everything else in onboarding rather than literal blue/pink. */
export const onboardingGenderColors = {
  male: '#6E8FAE',
  female: '#C48F94',
  diverse: '#9B87B8',
} as const;
