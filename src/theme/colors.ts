/**
 * Longlivy color tokens.
 * Every UI component must consume these via useTheme() instead of hardcoding hex values.
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
  background: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E3E7E4',
  divider: '#ECEFED',

  textPrimary: '#131C1A',
  textSecondary: '#5B6A66',
  textTertiary: '#8B9895',
  textInverse: '#FFFFFF',

  primary: '#0B4F4A',
  primaryMuted: '#E4EFEC',
  onPrimary: '#FFFFFF',

  secondary: '#D98E4A',
  onSecondary: '#241505',

  success: '#2E8B57',
  warning: '#C77E2A',
  danger: '#C4463A',
  info: '#3D77B3',

  fasting: '#0B4F4A',
  nutrition: '#D98E4A',
  activity: '#3D77B3',
  meditation: '#7A5FB0',
  weight: '#2E8B57',

  overlay: 'rgba(11, 22, 20, 0.45)',
  skeleton: '#E7EAE8',
};

export const darkColors: ColorTokens = {
  background: '#0D1412',
  surface: '#151F1D',
  surfaceElevated: '#1B2725',
  card: '#182422',
  border: '#26332F',
  divider: '#212D2A',

  textPrimary: '#F2F5F3',
  textSecondary: '#A8B5B1',
  textTertiary: '#76847F',
  textInverse: '#0D1412',

  primary: '#5FBFAE',
  primaryMuted: '#1C2E2A',
  onPrimary: '#052421',

  secondary: '#E7A868',
  onSecondary: '#241505',

  success: '#4FB77E',
  warning: '#E0A24E',
  danger: '#E06A5D',
  info: '#6AA3DE',

  fasting: '#5FBFAE',
  nutrition: '#E7A868',
  activity: '#6AA3DE',
  meditation: '#A98CE0',
  weight: '#4FB77E',

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#22302C',
};
