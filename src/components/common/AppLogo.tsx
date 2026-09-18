import React from 'react';
import { View, Image, ViewStyle } from 'react-native';

interface AppLogoProps {
  size: number;
  style?: ViewStyle;
}

/**
 * The HealthyMe logo mark — the one shared presentation for every place
 * the logo appears standalone (Splash, the language wheel screen). Two
 * things this deliberately gets right that are easy to get wrong
 * separately:
 *
 * 1. **The keyline crop.** `assets/app_logo.png` is a perfectly ordinary
 *    flat square source (as app-icon source art always is — masking is
 *    always applied by whatever presents it, never baked into the file)
 *    but it does have a thin black keyline baked into its edges (sampled:
 *    pure #000000 for ~1.6% of the image width, no alpha channel to trim
 *    via transparency). Rather than paint a matching background behind
 *    every place the mark appears, the image renders oversized (40%) with
 *    the outer ~20%-per-edge clipped away — well past the keyline (a
 *    tighter crop matching the sampled border still left a faint fringe;
 *    downscaling a 1254px source to a ~50–120px on-screen size bleeds the
 *    black edge a few extra pixels via bilinear filtering). The source
 *    file itself is never touched.
 * 2. **The rounded shape.** The crop above needs `overflow: 'hidden'` on
 *    its clipping container to work at all — which means that same
 *    container is also exactly where a corner radius has to live for the
 *    *image itself* to come out rounded, not a rounded card with a square
 *    image floating inside it. `radius` below is applied there, not on a
 *    separate wrapper.
 *
 * The soft shadow is on an outer, unclipped wrapper — a view with
 * `overflow: 'hidden'` clips its own shadow too, so getting both the
 * rounded clip and a visible shadow needs the shadow one level up.
 */
const RADIUS_RATIO = 0.22; // close to the proportion iOS uses for its own app-icon corner rounding — reads as "rounded square", not circular.

export const AppLogo: React.FC<AppLogoProps> = ({ size, style }) => {
  const overscan = size * 0.4;
  const radius = size * RADIUS_RATIO;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          elevation: 6,
        },
        style,
      ]}
    >
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden' }}>
        <Image
          source={require('../../../assets/icon.png')}
          style={{ position: 'absolute', top: -overscan / 2, left: -overscan / 2, width: size + overscan, height: size + overscan }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};
