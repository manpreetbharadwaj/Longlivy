/**
 * Longlivy color tokens.
 * Every UI component must consume these via useTheme() instead of hardcoding hex values.
 *
 * v5 palette — premium neutral redesign. The v4 palette leaned on one bright
 * cobalt-teal (#1BA7D1) as the primary accent AND reused it (or its lighter
 * glow sibling #5FE0FF) across fasting, statistics, and the home atmosphere
 * — blue ended up carrying nearly every highlight in the app, which reads
 * as "neon/gaming" rather than "quiet luxury" over long daily use.
 *
 * v5 keeps the same charcoal-graphite elevation structure but:
 *  - desaturates and darkens the primary accent into a muted steel blue —
 *    present, but no longer glowing
 *  - gives each pillar its own restrained, desaturated hue instead of
 *    sharing the primary blue, so sections stay distinguishable without
 *    the whole app reading as "blue"
 *  - pulls semantic state colors (success/warning/danger) toward the same
 *    muted family so nothing in the UI reads as a bright neon accent
 *
 * v6 section-identity pass: reassigned which pillar owns which hue so each
 * section's *character* matches its color, not just "a different color per
 * section" — activity stays the steel blue (energetic/performance reads as
 * blue), nutrition moved to warm amber (fresh/informative), meditation
 * moved to sage green (calm/natural), and fasting moved to muted violet
 * (a restrained "scientific/biological" accent, distinct from the other
 * three). Same hexes as before, just rotated between pillars — no new
 * colors invented.
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  border: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  primary: string;
  primaryMuted: string;
  onPrimary: string;

  secondary: string;
  onSecondary: string;

  success: string;
  warning: string;
  danger: string;
  info: string;

  fasting: string;
  nutrition: string;
  activity: string;
  meditation: string;
  weight: string;

  overlay: string;
  skeleton: string;
}

export const lightColors: ColorTokens = {
  background: '#F6F5F3',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E3E1DC',
  divider: '#ECEAE5',

  textPrimary: '#1B1B1D',
  textSecondary: '#5E5D5A',
  textTertiary: '#8C8A86',
  textInverse: '#FFFFFF',

  primary: '#3D5266',
  primaryMuted: '#E4E9ED',
  onPrimary: '#FFFFFF',

  secondary: '#A97A3E',
  onSecondary: '#FFFFFF',

  success: '#4C7A63',
  warning: '#B5793E',
  danger: '#AD5A50',
  info: '#3D5A73',

  fasting: '#6F638A',
  nutrition: '#A97A3E',
  activity: '#3D5A73',
  meditation: '#5C7A58',
  weight: '#4C7A63',

  overlay: 'rgba(20, 18, 16, 0.45)',
  skeleton: '#EDEBE7',
};

export const darkColors: ColorTokens = {
  background: '#0B0B0D',
  surface: '#141416',
  surfaceElevated: '#1C1C1F',
  card: '#18181B',
  border: '#2A2A2D',
  divider: '#212124',

  textPrimary: '#F2F1EE',
  textSecondary: '#9B9A97',
  textTertiary: '#6B6A67',
  textInverse: '#0B0B0D',

  primary: '#5C7A94',
  primaryMuted: '#1C242C',
  onPrimary: '#F2F1EE',

  secondary: '#C9974E',
  onSecondary: '#241505',

  success: '#5FA37D',
  warning: '#D9954B',
  danger: '#C97268',
  info: '#6E8FAE',

  fasting: '#8B7FA8',
  nutrition: '#C9974E',
  activity: '#6E8FAE',
  meditation: '#7A9B76',
  weight: '#6FA085',

  overlay: 'rgba(8, 8, 9, 0.6)',
  skeleton: '#1E1E21',
};
