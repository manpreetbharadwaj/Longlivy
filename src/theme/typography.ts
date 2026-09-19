import { TextStyle } from 'react-native';

/**
 * Named font files, loaded via `expo-font`/`@expo-google-fonts/*` in
 * `App.tsx` (`useAppFonts`) before the app renders any text — see
 * `src/hooks/useAppFonts.ts`. Two families, each doing one job:
 *  - `display*` (Fraunces, a warm editorial serif) carries headlines and
 *    large display type — the single biggest visual break from a
 *    system-font-only look.
 *  - `body*` (Manrope, a clean geometric sans) carries everything read at
 *    length or at speed: body copy, labels, and — deliberately, for
 *    legibility at a glance — the numeric metric styles too, so a serif
 *    headline never has to double as a calorie count or a timer readout.
 */
export const fontFamily = {
  displayMedium: 'Fraunces_500Medium',
  displaySemibold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
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
