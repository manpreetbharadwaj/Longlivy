import { ImageSourcePropType } from 'react-native';
import { ActivityType } from './models';

/**
 * Centralized lookup for the cinematic activity background images (dark
 * night-photography, subject positioned right-of-frame with the left side
 * already near-black — designed to sit behind card content without a
 * heavy overlay). Bundled locally under assets/images/, one require() per
 * type here rather than scattering require() calls across every component
 * that needs one.
 */
export const ACTIVITY_IMAGES: Record<ActivityType, ImageSourcePropType> = {
  running: require('../../../assets/images/running.png'),
  walking: require('../../../assets/images/walking.png'),
  cycling: require('../../../assets/images/cycling.png'),
  hiking: require('../../../assets/images/hiking.png'),
  jogging: require('../../../assets/images/jogging.png'),
  other: require('../../../assets/images/other.png'),
};

/** Safe accessor — falls back to the "other" image for any type not present in the map (e.g. a future ActivityType added without a matching asset yet). */
export function getActivityImage(type: ActivityType): ImageSourcePropType {
  return ACTIVITY_IMAGES[type] ?? ACTIVITY_IMAGES.other;
}
