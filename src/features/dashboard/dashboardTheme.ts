import { TextStyle, ViewStyle } from 'react-native';

/**
 * Premium dark-wellness tokens for the Home Dashboard.
 *
 * Scoped to this feature (same pattern as onboarding's onboardingTheme.ts)
 * rather than folded into the app-wide theme/colors.ts: the dashboard is a
 * hardcoded dark hero surface regardless of the device's light/dark
 * setting (same reasoning HeroCard/AppProgressRing already document).
 *
 * v5 premium-neutral pass: the old `accent`/`accentBright` pair
 * (#19B8F2/#25C7FF) was a bright, near-neon electric blue — on the single
 * most-viewed screen in the app, that read as "gaming HUD" rather than
 * "quiet luxury wellness-tech." Replaced with the same muted steel accent
 * as the app-wide `colors.ts` primary, and the neutral tones lost their
 * blue undertone in favor of a true warm-neutral charcoal, matching the
 * rest of the v5 palette so Home doesn't feel like a different app from
 * the sections around it.
 */
export const dashboardColors = {
  background: '#0A0A0C',
  surface: '#131315',
  surfaceElevated: '#1A1A1D',
  surfaceSecondary: '#1F1F22',

  textPrimary: '#F2F1EE',
  textSecondary: '#A6A5A2',
  textMuted: '#706F6C',

  accent: '#5C7A94',
  accentBright: '#7A97B0',
  accentDark: '#3D5266',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',

  success: '#5FA37D',
  warning: '#D9954B',
  danger: '#C97268',

  iconInactive: '#8B8A87',
  iconImportant: '#F2F1EE',
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
