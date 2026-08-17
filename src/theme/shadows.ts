import { Platform } from 'react-native';

export interface ShadowTokens {
  none: object;
  card: object;
  elevated: object;
  floating: object;
}

function shadow(elevation: number, opacity: number, radius: number, height: number) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
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
  card: shadow(2, 0.06, 8, 2),
  elevated: shadow(4, 0.08, 12, 4),
  floating: shadow(8, 0.12, 20, 8),
};

export const darkShadows: ShadowTokens = {
  none: {},
  card: shadow(2, 0.3, 8, 2),
  elevated: shadow(4, 0.35, 12, 4),
  floating: shadow(8, 0.4, 20, 8),
};
