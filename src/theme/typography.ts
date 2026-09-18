import { TextStyle } from 'react-native';

/**
 * Named font files, loaded via `expo-font`/`@expo-google-fonts/*` in
 * `App.tsx` (`useAppFonts`) before the app renders any text — see
 * `src/hooks/useAppFonts.ts`. A single family, Manrope (a clean geometric
 * sans), carries the entire type system — display/heading, body, and
 * metric styles alike. Unifying on one face instead of pairing in an
 * editorial serif keeps the read minimal and "health-tech" rather than
 * warm/editorial, and means a heading and a calorie count or timer
 * readout always feel like the same product.
 */
export const fontFamily = {
  displayMedium: 'Manrope_600SemiBold',
  displaySemibold: 'Manrope_700Bold',
  displayBold: 'Manrope_800ExtraBold',
  displayItalic: 'Manrope_600SemiBold',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;

export interface TypographyTokens {
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  headingLarge: TextStyle;
  headingMedium: TextStyle;
  headingSmall: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  label: TextStyle;
  caption: TextStyle;
  metricLarge: TextStyle;
  metricMedium: TextStyle;
  /** The giant numeric readout on the onboarding ruler pickers (age/height/weight) and the calibration screen's calorie count-up — one size up from `metricLarge`, reserved for a single hero number per screen. */
  metricHero: TextStyle;
}

export const typography: TypographyTokens = {
  displayLarge: { fontFamily: fontFamily.displaySemibold, fontSize: 36, lineHeight: 42, letterSpacing: -0.3 },
  displayMedium: { fontFamily: fontFamily.displaySemibold, fontSize: 29, lineHeight: 35, letterSpacing: -0.2 },
  headingLarge: { fontFamily: fontFamily.displaySemibold, fontSize: 22, lineHeight: 28 },
  headingMedium: { fontFamily: fontFamily.bodySemibold, fontSize: 18, lineHeight: 24 },
  headingSmall: { fontFamily: fontFamily.bodySemibold, fontSize: 16, lineHeight: 22 },
  bodyLarge: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 23 },
  bodyMedium: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 17 },
  label: { fontFamily: fontFamily.bodySemibold, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 },
  caption: { fontFamily: fontFamily.bodyMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
  metricLarge: { fontFamily: fontFamily.bodyExtraBold, fontSize: 38, lineHeight: 42, letterSpacing: -0.5 },
  metricMedium: { fontFamily: fontFamily.bodyBold, fontSize: 23, lineHeight: 27 },
  metricHero: { fontFamily: fontFamily.bodyExtraBold, fontSize: 64, lineHeight: 68, letterSpacing: -1.5 },
};
