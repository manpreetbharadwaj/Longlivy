/**
 * Onboarding's own visual system — deliberately separate from `@/theme/gradients`
 * so onboarding's atmosphere can stay a touch more cinematic than the app's
 * everyday screens, but built from the *same* accent family so the two
 * never read as two different products.
 *
 * Matches the app-wide "Deep Current" identity: the base gradient is a
 * near-black navy, `onboardingAccent` is the brand cyan (not a borrowed
 * jade/green), and `onboardingNeutral` stays a cool slate for decorative
 * icon tiles/preview rows that aren't a primary action — so the one bold
 * accent color doesn't end up on every element on screen at once.
 */

/** Base atmosphere for every onboarding screen — near-black navy, matching the app-wide hero gradient. */
export const onboardingGradient = ['#05080B', '#0A1218', '#0F1B22'] as const;

/** Slightly lifted panel tone for glass surfaces sitting on top of the base gradient. */
export const onboardingPanelGradient = ['#0F1B22', '#16242C'] as const;

/** The one bold accent — brand cyan, matching the app's `primary` token. Reserved for things that genuinely need to stand out: the primary CTA, a selected state, a data highlight — not every icon/border in the flow (see `onboardingNeutral` for those). */
export const onboardingAccent = '#22D3EE';
/** Deeper stop for the accent gradient — keeps the CTA from reading as a flat sticker. */
export const onboardingAccentDeep = '#0E9BB5';
/** A lighter tint of the same accent hue — reserved for numeric/data moments (ruler pickers, calorie count-up) so it reads as "your data, in focus" rather than a second, unrelated brand color. */
export const onboardingData = '#67E8F9';

/** Cool slate — the default tone for decorative icon tiles, badges and preview rows that aren't a primary action or a live selection. */
export const onboardingNeutral = '#7E93A0';
/** A softer, deeper slate — for a neutral tile's background wash where `onboardingNeutral` itself is used for the border/icon (mirrors how `onboardingAccent` pairs with its own `22`/`55` alpha washes). */
export const onboardingNeutralDeep = '#4E606B';

export const onboardingCtaGradient = [onboardingAccent, onboardingAccentDeep] as const;
export const onboardingGlow = [onboardingAccent, onboardingAccentDeep] as const;

/** Glass-surface tokens shared by every onboarding component (cards, inputs, chips). */
export const onboardingGlass = {
  fill: 'rgba(226,241,245,0.05)',
  fillSelected: 'rgba(34,211,238,0.18)',
  border: 'rgba(226,241,245,0.12)',
  borderSelected: onboardingAccent,
  textPrimary: '#F2F7F9',
  textSecondary: 'rgba(242,247,249,0.62)',
  textTertiary: 'rgba(242,247,249,0.4)',
} as const;

/** Per-pillar accent used across onboarding's pillar-themed surfaces — matches the same reassigned per-pillar colors used everywhere else in the app (`@/theme/colors.ts`): fasting indigo, nutrition amber, activity coral, meditation violet. */
export const onboardingPillarColors = {
  fasting: '#7C93F0',
  nutrition: '#F5A94E',
  activity: '#FF7A63',
  meditation: '#B79AF5',
} as const;

export type PillarKey = keyof typeof onboardingPillarColors;

/** Goal-card accents — one per outcome, each with a matching gradient for its sparkline. */
export const onboardingGoalColors = {
  weight_loss: { accent: '#22D3EE', gradient: ['#67E8F9', '#0E9BB5'] as const },
  maintenance: { accent: '#7C93F0', gradient: ['#9FB0F5', '#3B4A9E'] as const },
  muscle_gain: { accent: '#F5A94E', gradient: ['#F8C685', '#A2650F'] as const },
} as const;

/** Gender-glyph accents for the Gender step — icon-only color identity (the card itself stays neutral), same restrained/desaturated family as everything else in onboarding rather than literal blue/pink. */
export const onboardingGenderColors = {
  male: '#7C93F0',
  female: '#E1A7AC',
  diverse: '#B79AF5',
} as const;
