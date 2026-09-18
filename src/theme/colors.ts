/**
 * HealthyMe color tokens — "Deep Current."
 *
 * Every UI component must consume these via useTheme() instead of
 * hardcoding hex values.
 *
 * Dark-first: a near-black navy neutral scale (not a warm ink, not a true
 * cool charcoal) paired with a single restrained cyan/aqua brand accent.
 * The accent is used deliberately sparingly — most surfaces stay flat dark
 * navy/charcoal, cyan is reserved for primary actions, selected states and
 * glow moments, so the app never reads as "everything blue." Pillar hues
 * are each a distinct family so no health domain is confused with another
 * or with the brand accent itself: fasting reads as indigo (focused),
 * nutrition as warm amber (nourishment), activity as coral (energetic),
 * meditation as soft violet (calm), weight/progress as teal (analytical,
 * closest to the brand family but still distinguishable from it).
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
  background: '#F4F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#DCE7EA',
  divider: '#E7EFF1',

  textPrimary: '#0E1B22',
  textSecondary: '#51636C',
  textTertiary: '#8598A1',
  textInverse: '#FFFFFF',

  primary: '#0891B2',
  primaryMuted: '#DFF4F8',
  onPrimary: '#FFFFFF',

  secondary: '#0D9488',
  onSecondary: '#FFFFFF',

  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0284C7',

  fasting: '#4C63C7',
  nutrition: '#C2790F',
  activity: '#E1583D',
  meditation: '#8B5CF6',
  weight: '#0D9488',

  overlay: 'rgba(14, 27, 34, 0.45)',
  skeleton: '#E7EFF1',
};

export const darkColors: ColorTokens = {
  background: '#080D12',
  surface: '#0F161C',
  surfaceElevated: '#141D24',
  card: '#121A21',
  border: 'rgba(148, 197, 209, 0.14)',
  divider: '#1B252D',

  textPrimary: '#F2F7F9',
  textSecondary: '#8DA0AB',
  textTertiary: '#5C6C76',
  textInverse: '#071016',

  primary: '#22D3EE',
  primaryMuted: '#123138',
  onPrimary: '#04141A',

  secondary: '#14B8A6',
  onSecondary: '#041512',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#38BDF8',

  fasting: '#7C93F0',
  nutrition: '#F5A94E',
  activity: '#FF7A63',
  meditation: '#B79AF5',
  weight: '#2DD4BF',

  overlay: 'rgba(3, 6, 9, 0.7)',
  skeleton: '#16202A',
};
