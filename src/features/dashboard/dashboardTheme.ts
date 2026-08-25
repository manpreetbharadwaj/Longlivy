import { TextStyle, ViewStyle } from 'react-native';

/**
 * Premium dark-wellness tokens for the Home Dashboard redesign.
 *
 * Scoped to this feature (same pattern as onboarding's onboardingTheme.ts)
 * rather than folded into the app-wide theme/colors.ts: the dashboard is a
 * hardcoded dark hero surface regardless of the device's light/dark
 * setting (same reasoning HeroCard/AppProgressRing already document), and
 * these exact hex values were specified as the visual source of truth for
 * this redesign. They sit extremely close to the app's existing darkColors
 * (same charcoal-graphite + cobalt-teal language), just pinned to the
 * requested values instead of drifting.
 */
export const dashboardColors = {
  background: '#070A0F',
  surface: '#0D1219',
  surfaceElevated: '#111720',
  surfaceSecondary: '#151B24',

  textPrimary: '#F5F7FA',
  textSecondary: '#A7AFBB',
  textMuted: '#697382',

  accent: '#19B8F2',
  accentBright: '#25C7FF',
  accentDark: '#087DAA',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',

  success: '#22C985',
  warning: '#F3B44B',
  danger: '#FF6B6B',

  iconInactive: '#8B94A3',
  iconImportant: '#F5F7FA',
} as const;

/** Level-2 "dark elevated surface" card — the default for most dashboard sections. Spread into a HeroCard's `style` prop to override its glassy default without touching HeroCard.tsx (shared by many other screens). */
export const dashboardCardStyle: ViewStyle = {
  backgroundColor: dashboardColors.surfaceElevated,
  borderWidth: 1,
  borderColor: dashboardColors.border,
  borderRadius: 20,
};

/** Level-3 "floating/glass surface" — for the tab bar and the raised center action button. Slightly more opaque + a touch more border than the card level, so it still reads as detached from the content behind it. */
export const dashboardFloatingStyle: ViewStyle = {
  backgroundColor: 'rgba(13,18,25,0.94)',
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
  borderRadius: 24,
  ...dashboardShadow,
};
