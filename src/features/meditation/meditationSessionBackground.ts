import { ImageSourcePropType } from 'react-native';

/**
 * Slot for the premium cinematic background image on `MeditationPlayerScreen`
 * (a seated silhouette in a deep-blue atmospheric environment). The asset
 * doesn't exist yet — `require()`-ing a path that isn't on disk would break
 * the Metro bundle, so this stays `undefined` until the file is added.
 *
 * To wire it in:
 * 1. Drop the generated image at `assets/images/meditation-session-bg.jpg`.
 * 2. Set this to `require('../../../assets/images/meditation-session-bg.jpg')`.
 * `MeditationPlayerScreen` already passes it through to `SectionHeroLayout`'s
 * `backgroundImageSource` prop — no other code changes needed.
 */
export const MEDITATION_SESSION_BACKGROUND_SOURCE: ImageSourcePropType | undefined = undefined;

/** The intended generation prompt, kept alongside the slot above for reference. */
export const MEDITATION_SESSION_BACKGROUND_PROMPT =
  'Premium cinematic meditation environment for a modern longevity and wellness mobile app, deep sophisticated blue atmosphere, peaceful human silhouette sitting cross-legged in a meditation pose, subtle soft blue ambient light surrounding the figure, gentle mist, atmospheric depth, minimal abstract environment, delicate floating particles, soft volumetric light, calm cinematic composition, large negative space around the subject for mobile UI overlays, elegant wellness aesthetic, realistic but slightly artistic, high-end premium health application visual, deep blue and subtle cyan tones, tranquil, immersive, relaxing, no text, no logo, no UI, no watermark, vertical mobile composition.';
