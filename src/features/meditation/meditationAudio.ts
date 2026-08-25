import type { AudioSource } from 'expo-audio';

/**
 * Central map of every local meditation MP3 bundled with the app. A
 * `Meditation`'s `audioReference` is one of these keys — nothing outside
 * this file should ever `require()` a sound asset directly, so there's a
 * single place to add/replace/remove a track.
 */
export const MEDITATION_AUDIO_SOURCES = {
  morning_clarity: require('../../../assets/sounds/danamusic-relaxing-flute-meditation-416756.mp3'),
  deep_relaxation: require('../../../assets/sounds/leberch-deep-meditation-375362.mp3'),
  stress_reset: require('../../../assets/sounds/atlasaudio-zen-meditation-588147.mp3'),
  mindful_minutes: require('../../../assets/sounds/monume-meditation-meditation-music-547905.mp3'),
  wind_down: require('../../../assets/sounds/nastelbom-meditation-463389.mp3'),
  focus_builder: require('../../../assets/sounds/leberch-meditation-583077.mp3'),
  body_scan: require('../../../assets/sounds/leberch-meditation-meditation-music-523576.mp3'),
  evening_unwind: require('../../../assets/sounds/apalonbeats-meditation-meditation-music-576281.mp3'),
  calm_breath: require('../../../assets/sounds/atlasaudio-deep-meditation-588149.mp3'),
  quiet_mind: require('../../../assets/sounds/leberch-peaceful-meditation-251475.mp3'),
  serenity_flow: require('../../../assets/sounds/leberch-meditation-meditation-music-580539.mp3'),
  full_presence: require('../../../assets/sounds/leberch-meditation-578429.mp3'),
  ocean_of_calm: require('../../../assets/sounds/verclub_music-meditation-music-550885.mp3'),
} as const satisfies Record<string, AudioSource>;

export type MeditationAudioKey = keyof typeof MEDITATION_AUDIO_SOURCES;

/** Resolves a `Meditation.audioReference` to a loadable `AudioSource`, or `null` for content with no track (e.g. free/unguided sessions). */
export function resolveMeditationAudioSource(audioReference: string | null | undefined): AudioSource | null {
  if (!audioReference) return null;
  return MEDITATION_AUDIO_SOURCES[audioReference as MeditationAudioKey] ?? null;
}
