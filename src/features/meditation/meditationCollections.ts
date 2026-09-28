import { MeditationTopic } from './models';
import type { MeditationArtKind } from './components/MeditationArt';

export type MeditationCollectionId = 'sleep' | 'stress_relaxation' | 'focus' | 'nature';

export interface MeditationCollection {
  id: MeditationCollectionId;
  /** Existing topics this collection groups - nothing new is added to the content taxonomy, the collection is only a friendlier front door onto it. */
  topics: MeditationTopic[];
  art: MeditationArtKind;
}

/**
 * The four discovery collections on the Meditation landing. Nature is not a
 * topic in the content taxonomy - it is the pure-soundscape route (rain,
 * forest, ocean...), so it has no topics and opens the soundscape screen.
 */
export const MEDITATION_COLLECTIONS: MeditationCollection[] = [
  { id: 'sleep', topics: ['sleep'], art: 'sleep' },
  { id: 'stress_relaxation', topics: ['stress_relief', 'relaxation'], art: 'stress_relaxation' },
  { id: 'focus', topics: ['focus'], art: 'focus' },
  { id: 'nature', topics: [], art: 'nature' },
];

export function getMeditationCollection(id: MeditationCollectionId): MeditationCollection {
  return MEDITATION_COLLECTIONS.find((collection) => collection.id === id)!;
}

/** Durations offered for a soundscape session, in seconds - includes the 3-minute "short session". */
export const SOUNDSCAPE_DURATION_OPTIONS_SECONDS = [180, 300, 600, 900, 1800, 2700, 3600];
export const DEFAULT_SOUNDSCAPE_DURATION_SECONDS = 600;
