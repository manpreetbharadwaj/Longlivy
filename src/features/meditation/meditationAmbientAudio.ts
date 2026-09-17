import type { AudioSource } from 'expo-audio';

/**
 * Central map of bundled ambient-sound MP3s — mirrors meditationAudio.ts's
 * pattern exactly, kept as a separate map because ambient sounds are a
 * distinct concept from primary Meditation audio (see ambientSounds.ts).
 * Every entry here is a real, license-verified CC0 recording — see
 * AMBIENT_SOUND_LICENSES in licensing/audioSources.ts for provenance.
 * Adding another sound later is: place the file, add its key here, then flip
 * that AmbientSound's availability in ambientSounds.ts — no other code change.
 */
export const MEDITATION_AMBIENT_AUDIO_SOURCES = {
  ambient_rain_soft: require('../../../assets/sounds/ambient_rain_soft.mp3'),
  ambient_ocean_swells: require('../../../assets/sounds/ambient_ocean_swells.mp3'),
  ambient_forest_spring: require('../../../assets/sounds/ambient_forest_spring.mp3'),
  ambient_fire_campfire: require('../../../assets/sounds/ambient_fire_campfire.mp3'),
  ambient_neutral_pad: require('../../../assets/sounds/ambient_neutral_pad.mp3'),
} as const satisfies Record<string, AudioSource>;

export type MeditationAmbientAudioKey = keyof typeof MEDITATION_AMBIENT_AUDIO_SOURCES;

/** Resolves an `AmbientSound.audioReference` to a loadable `AudioSource`, or `null` for anything not yet registered (i.e. every 'coming_soon' sound today). */
export function resolveAmbientAudioSource(audioReference: string | null | undefined): AudioSource | null {
  if (!audioReference) return null;
  return MEDITATION_AMBIENT_AUDIO_SOURCES[audioReference as MeditationAmbientAudioKey] ?? null;
}
