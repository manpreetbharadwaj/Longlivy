/**
 * Solace color tokens — "Warm Ink & Jade."
 *
 * Every UI component must consume these via useTheme() instead of
 * hardcoding hex values.
 *
 * Deliberately a different temperature and structure from a cool
 * charcoal-and-steel-blue palette, not a re-tint of one:
 *  - the neutral scale is warm (a soft ink/espresso dark, a warm parchment
 *    light) instead of true/cool gray, so both themes read as "paper and
 *    warmth" rather than "glass and steel"
 *  - the brand primary is a deep jade/emerald — a color no pillar shares —
 *    instead of a muted blue that doubled as both "the brand" and "the
 *    activity pillar"
 *  - pillar hues are deliberately reassigned rather than reused: fasting
 *    now reads as indigo (a "focused/analytical" mood), activity as
 *    terracotta (energetic/warm), nutrition as golden ochre
 *    (food/nourishment), meditation as dusty plum (calm but distinct from
 *    the brand's own green), weight/progress as teal. No pillar owns the
 *    brand's primary hue, and no two pillars share a hue family.
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
  background: '#FAF6EF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E7DFCE',
  divider: '#EFE9DB',

  textPrimary: '#211C14',
  textSecondary: '#665D4C',
  textTertiary: '#9A907C',
  textInverse: '#FFFFFF',

  primary: '#1F6F5C',
  primaryMuted: '#DCEAE4',
  onPrimary: '#FFFFFF',

  secondary: '#B5772E',
  onSecondary: '#FFFFFF',

  success: '#3C7A5D',
  warning: '#B5772E',
  danger: '#B04A3C',
  info: '#3E5A8C',

  fasting: '#3E5A8C',
  nutrition: '#B5842E',
  activity: '#C1622E',
  meditation: '#7C5A94',
  weight: '#2E7A7A',

  overlay: 'rgba(33, 24, 15, 0.45)',
  skeleton: '#EFE7D5',
};

export const darkColors: ColorTokens = {
  background: '#13110D',
  surface: '#1B1815',
  surfaceElevated: '#221E19',
  card: '#1E1A16',
  border: '#332C22',
  divider: '#282219',

  textPrimary: '#F6EFE2',
  textSecondary: '#B3A791',
  textTertiary: '#7D7362',
  textInverse: '#13110D',

  primary: '#4FAE8F',
  primaryMuted: '#1C2E28',
  onPrimary: '#0B1613',

  secondary: '#D6A253',
  onSecondary: '#2A1B08',

  success: '#59A184',
  warning: '#D6A253',
  danger: '#CB6E5C',
  info: '#6E8DBE',

  fasting: '#6E8DBE',
  nutrition: '#D6A253',
  activity: '#D98657',
  meditation: '#A186BD',
  weight: '#4FA3A3',

  overlay: 'rgba(10, 8, 5, 0.6)',
  skeleton: '#241F19',
};
