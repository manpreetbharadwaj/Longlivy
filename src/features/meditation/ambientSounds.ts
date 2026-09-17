import { MeditationTopic, MeditationAvailability } from './models';

/**
 * The secondary, optional audio layer a session can play underneath the
 * primary Guided voice / Unguided music — deliberately a separate concept
 * from `Meditation` (see meditationTaxonomy.ts's Primary-vs-Ambient split in
 * the Player integration). Phase 5 added five real, CC0-licensed recordings
 * (see licensing/audioSources.ts for full provenance per asset).
 */
export type AmbientSoundType = 'rain' | 'ocean' | 'forest' | 'fire' | 'ambient';

export interface AmbientSound {
  id: string;
  type: AmbientSoundType;
  title: string;
  /** Resolves through meditationAmbientAudio.ts — never a raw require() at the call site. */
  audioReference?: string;
  availability: MeditationAvailability;
  loopable: boolean;
  /** Content-management metadata only — never shown in end-user UI. */
  source?: string;
  license?: string;
  /** Topics this sound is a good fit for — drives getRecommendedAmbientSounds(), not the other way around, so there's one source of truth instead of two tables that can drift apart. */
  recommendedTopics?: MeditationTopic[];
}

// All five now have a real, verified CC0 recording (Phase 5) — source/license
// strings are short pointers into licensing/audioSources.ts, the full
// developer-facing record, not the complete terms themselves.
export const AMBIENT_SOUND_CATALOG: AmbientSound[] = [
  {
    id: 'ambient_rain',
    type: 'rain',
    title: 'Rain',
    audioReference: 'ambient_rain_soft',
    availability: 'available',
    loopable: true,
    recommendedTopics: ['sleep', 'stress_relief'],
    source: 'Freesound.org — speakwithanimals',
    license: 'CC0 1.0 — see licensing/audioSources.ts',
  },
  {
    id: 'ambient_ocean',
    type: 'ocean',
    title: 'Ocean',
    audioReference: 'ambient_ocean_swells',
    availability: 'available',
    loopable: true,
    recommendedTopics: ['sleep', 'relaxation', 'stress_relief', 'calm'],
    source: 'Freesound.org — bassimat',
    license: 'CC0 1.0 — see licensing/audioSources.ts',
  },
  {
    id: 'ambient_forest',
    type: 'forest',
    title: 'Forest',
    audioReference: 'ambient_forest_spring',
    availability: 'available',
    loopable: true,
    recommendedTopics: ['relaxation', 'stress_relief', 'morning'],
    source: 'Freesound.org — GowlerMusic',
    license: 'CC0 1.0 — see licensing/audioSources.ts',
  },
  {
    id: 'ambient_fire',
    type: 'fire',
    title: 'Fireplace',
    audioReference: 'ambient_fire_campfire',
    availability: 'available',
    loopable: true,
    source: 'Freesound.org — HECKFRICKER',
    license: 'CC0 1.0 — see licensing/audioSources.ts',
  },
  {
    id: 'ambient_neutral',
    type: 'ambient',
    title: 'Ambient',
    audioReference: 'ambient_neutral_pad',
    availability: 'available',
    loopable: true,
    recommendedTopics: ['sleep', 'relaxation', 'calm', 'focus'],
    source: 'Freesound.org — bassimat',
    license: 'CC0 1.0 — see licensing/audioSources.ts',
  },
];

export function getAmbientSound(id: string): AmbientSound | undefined {
  return AMBIENT_SOUND_CATALOG.find((sound) => sound.id === id);
}

/** Deterministic, catalog-driven recommendations — recommends nothing for a topic no sound lists, rather than guessing. */
export function getRecommendedAmbientSounds(topic: MeditationTopic): AmbientSound[] {
  return AMBIENT_SOUND_CATALOG.filter((sound) => sound.recommendedTopics?.includes(topic));
}

/** Whether the Soundscape control has anything real to offer right now — see MeditationPlayerScreen for how this gates the control's visibility. */
export function hasAnyAvailableAmbientSound(): boolean {
  return AMBIENT_SOUND_CATALOG.some((sound) => sound.availability === 'available');
}
