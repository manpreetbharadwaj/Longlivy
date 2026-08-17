import { ColorTokens, lightColors, darkColors } from './colors';
import { typography, TypographyTokens } from './typography';
import { spacing, radius, componentSizes } from './spacing';
import { ShadowTokens, lightShadows, darkShadows } from './shadows';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  componentSizes: typeof componentSizes;
  shadows: ShadowTokens;
}

export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    typography,
    spacing,
    radius,
    componentSizes,
    shadows: mode === 'dark' ? darkShadows : lightShadows,
  };
}

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
