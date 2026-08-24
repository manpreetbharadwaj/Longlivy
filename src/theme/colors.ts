/**
 * Longlivy color tokens.
 * Every UI component must consume these via useTheme() instead of hardcoding hex values.
 *
 * v4 palette — premium dark refinement. Same charcoal-graphite structure as
 * v3 (a real elevation hierarchy, not one flat gray), but the base tones now
 * carry a subtle blue-black undertone instead of being perfectly neutral,
 * and the single bold accent moved from a bright mint-emerald to a deeper,
 * richer cobalt-teal — reads as premium health-tech rather than a flat
 * "dark mode + bright green button" combination. Feature tones
 * (nutrition/activity/meditation/weight) are untouched — they're deliberate,
 * muted category markers, not part of the accent system.
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
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#DFE2E8',
  divider: '#E7E9EE',

  textPrimary: '#15171C',
  textSecondary: '#565C68',
  textTertiary: '#868C99',
  textInverse: '#FFFFFF',

  primary: '#0E7A9E',
  primaryMuted: '#DEF1F6',
  onPrimary: '#FFFFFF',

  secondary: '#B0791E',
  onSecondary: '#FFFFFF',

  success: '#1F8F5F',
  warning: '#B4791E',
  danger: '#C4463A',
  info: '#3D77B3',

  fasting: '#0E7A9E',
  nutrition: '#B0791E',
  activity: '#3D77B3',
  meditation: '#7C5FB0',
  weight: '#1F8F5F',

  overlay: 'rgba(15, 17, 22, 0.45)',
  skeleton: '#E9EBEF',
};

export const darkColors: ColorTokens = {
  background: '#0A0B0F',
  surface: '#12141B',
  surfaceElevated: '#1B1E28',
  card: '#161922',
  border: '#262A35',
  divider: '#1E212B',

  textPrimary: '#F3F4F7',
  textSecondary: '#9CA3B2',
  textTertiary: '#6B7280',
  textInverse: '#0A0B0F',

  primary: '#1BA7D1',
  primaryMuted: '#0F2B34',
  onPrimary: '#04222B',

  secondary: '#E0AC55',
  onSecondary: '#241505',

  success: '#3FCE87',
  warning: '#E0A94E',
  danger: '#E5695C',
  info: '#5B9BD5',

  fasting: '#1BA7D1',
  nutrition: '#E0AC55',
  activity: '#5B9BD5',
  meditation: '#A78BC9',
  weight: '#3FCE87',

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#22252F',
};
