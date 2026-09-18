import { Platform } from 'react-native';

export interface ShadowTokens {
  none: object;
  card: object;
  elevated: object;
  floating: object;
}

/**
 * A cool navy-tinted shadow color instead of pure black — soft shadows pick
 * up a faint navy undertone that matches the brand's cool neutral palette
 * instead of reading as a generic warm drop shadow.
 */
const SHADOW_COLOR_LIGHT = '#0E1B22';
const SHADOW_COLOR_DARK = '#000000';

function shadow(shadowColor: string, elevation: number, opacity: number, radius: number, height: number) {
  return Platform.select({
    ios: {
      shadowColor,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height },
    },
    android: { elevation },
    default: {},
  }) as object;
}

export const lightShadows: ShadowTokens = {
  none: {},
  card: shadow(SHADOW_COLOR_LIGHT, 2, 0.07, 10, 3),
  elevated: shadow(SHADOW_COLOR_LIGHT, 4, 0.1, 14, 5),
  floating: shadow(SHADOW_COLOR_LIGHT, 8, 0.14, 22, 9),
};

export const darkShadows: ShadowTokens = {
  none: {},
  card: shadow(SHADOW_COLOR_DARK, 2, 0.3, 8, 2),
  elevated: shadow(SHADOW_COLOR_DARK, 4, 0.35, 12, 4),
  floating: shadow(SHADOW_COLOR_DARK, 8, 0.4, 20, 8),
};
