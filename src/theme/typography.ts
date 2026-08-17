import { TextStyle } from 'react-native';

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
}

export const typography: TypographyTokens = {
  displayLarge: { fontSize: 34, fontWeight: '700', lineHeight: 40 },
  displayMedium: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  headingLarge: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  headingMedium: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  headingSmall: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 16 },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 14 },
  metricLarge: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  metricMedium: { fontSize: 24, fontWeight: '700', lineHeight: 28 },
};
