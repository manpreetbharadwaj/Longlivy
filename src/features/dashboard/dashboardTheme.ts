import { TextStyle, ViewStyle } from 'react-native';

/**
 * Deep Current tokens for the Home Dashboard and the floating tab bar.
 *
 * Scoped to this feature (same pattern as onboarding's onboardingTheme.ts)
 * rather than folded into the app-wide theme/colors.ts: the dashboard (and
 * the tab bar it lends its surfaces to) is a hardcoded dark hero surface
 * regardless of the device's light/dark setting (same reasoning
 * HeroCard/AppProgressRing already document).
 *
 * Matches the app-wide "Deep Current" identity (`theme/colors.ts`) — near-
 * black navy neutrals with a single restrained cyan accent.
 */
export const dashboardColors = {
  background: '#080D12',
  surface: '#0F161C',
  surfaceElevated: '#141D24',
  surfaceSecondary: '#182129',

  textPrimary: '#F2F7F9',
  textSecondary: '#8DA0AB',
  textMuted: '#5C6C76',

  accent: '#22D3EE',
  accentBright: '#67E8F9',
  accentDark: '#0E9BB5',

  border: 'rgba(148, 197, 209, 0.10)',
  borderStrong: 'rgba(148, 197, 209, 0.18)',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  iconInactive: '#5C6C76',
  iconImportant: '#F2F7F9',
} as const;

/** Level-2 "dark elevated surface" card — the default for most dashboard sections. Spread into a HeroCard's `style` prop to override its glassy default without touching HeroCard.tsx (shared by many other screens). */
export const dashboardCardStyle: ViewStyle = {
  backgroundColor: dashboardColors.surfaceElevated,
  borderWidth: 1,
  borderColor: dashboardColors.border,
  borderRadius: 22,
};

/** Level-3 "floating/glass surface" — for the tab bar and the raised center action button. Slightly more opaque + a touch more border than the card level, so it still reads as detached from the content behind it. */
export const dashboardFloatingStyle: ViewStyle = {
  backgroundColor: 'rgba(9,14,19,0.92)',
  borderWidth: 1,
  borderColor: dashboardColors.border,
};

/** A single, deliberately soft shadow — used sparingly (floating elements only) per the "avoid excessive shadows" guidance. */
export const dashboardShadow: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
};

export const dashboardTypeOverrides: { heroNumber: TextStyle } = {
  heroNumber: { letterSpacing: -0.5 },
};

/** `dashboardCardStyle` with real depth (shadow) added — for cards that should visually sit above the rest of the stack, not just tonally differ. Same hardcoded-dark reasoning as `dashboardShadow`. */
export const dashboardCardElevated: ViewStyle = {
  ...dashboardCardStyle,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 4,
};

/** The Home command-center hero card — one step more prominent than `dashboardCardElevated`, for the single top-of-screen card that anchors the rest of the dashboard. */
export const dashboardHeroCardStyle: ViewStyle = {
  backgroundColor: dashboardColors.surfaceElevated,
  borderWidth: 1.5,
  borderColor: dashboardColors.borderStrong,
  borderRadius: 26,
  ...dashboardShadow,
};
