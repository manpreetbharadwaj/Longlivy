import type { AudioSource } from 'expo-audio';
import { resolveMeditationAudioSource } from './meditationAudio';
import { resolveAmbientAudioSource } from './meditationAmbientAudio';
import { AMBIENT_SOUND_CATALOG, AmbientSoundType } from './ambientSounds';

/**
 * The coarse background category a breathing session can play underneath
 * itself — deliberately category-level (not "pick a specific sound") to
 * keep the control restrained (Section 11/12). Reuses the Phase 3 ambient
 * architecture rather than a second background-audio system: 'ambient' and
 * 'nature' resolve through the same AMBIENT_SOUND_CATALOG/availability
 * rules, so they're honestly Coming Soon until a real sound exists there.
 * 'meditation_music' is the one mode that's real today — it reuses an
 * existing primary-audio track, not a new asset.
 */
export type BreathingBackgroundMode = 'none' | 'meditation_music' | 'ambient' | 'nature';

const NATURE_TYPES: AmbientSoundType[] = ['rain', 'ocean', 'forest', 'fire'];

// One calm, already-real track stands in for "meditation music" background —
// reusing existing primary Guided audio rather than a dedicated asset.
const MEDITATION_MUSIC_BACKGROUND_KEY = 'quiet_mind';

function findAvailableAmbientOfTypes(types: AmbientSoundType[]) {
  return AMBIENT_SOUND_CATALOG.find((sound) => types.includes(sound.type) && sound.availability === 'available');
}

export function isBreathingBackgroundModeAvailable(mode: BreathingBackgroundMode): boolean {
  switch (mode) {
    case 'none':
    case 'meditation_music':
      return true;
    case 'ambient':
      return findAvailableAmbientOfTypes(['ambient']) != null;
    case 'nature':
      return findAvailableAmbientOfTypes(NATURE_TYPES) != null;
    default:
      return false;
  }
}

/** Resolves a background mode to a loadable source, or `null` for 'none' and for any mode with no available sound yet (never a load attempt on a Coming Soon sound). */
export function resolveBreathingBackgroundSource(mode: BreathingBackgroundMode): AudioSource | null {
  switch (mode) {
    case 'meditation_music':
      return resolveMeditationAudioSource(MEDITATION_MUSIC_BACKGROUND_KEY);
    case 'ambient': {
      const sound = findAvailableAmbientOfTypes(['ambient']);
      return sound ? resolveAmbientAudioSource(sound.audioReference) : null;
    }
    case 'nature': {
      const sound = findAvailableAmbientOfTypes(NATURE_TYPES);
      return sound ? resolveAmbientAudioSource(sound.audioReference) : null;
    }
    case 'none':
    default:
      return null;
  }
}
