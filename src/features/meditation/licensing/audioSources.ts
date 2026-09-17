/**
 * Developer-facing provenance record for every bundled ambient audio asset —
 * never imported by UI code, never shown to end users (Section 4: the Player
 * only ever shows plain names like "Rain", never license text). This is the
 * single place to check before adding, replacing, or removing an ambient
 * asset, so licensing facts live in one structured record instead of
 * scattered code comments.
 *
 * All five entries below were sourced from Freesound.org, verified
 * individually on 2026-09-17 by fetching each sound's own page and
 * confirming the license shown there before downloading. Freesound's CC0
 * ("Creative Commons 0" / Public Domain Dedication) sounds require no
 * attribution and are safe for commercial closed-source use.
 *
 * Pixabay (the client's suggested source) was investigated first but its
 * site blocks direct programmatic downloads in this environment (HTTP 403
 * from an automated fetch, even though its Content License terms — verified
 * via https://pixabay.com/service/license-summary/ — are equally permissive)
 * — so no Pixabay asset was added this phase; this is a technical access
 * limitation, not a licensing rejection.
 */
export interface AmbientAudioSourceRecord {
  /** Matches the key in meditationAmbientAudio.ts and the AmbientSound.audioReference that uses it. */
  audioReferenceKey: string;
  filename: string;
  title: string;
  provider: string;
  creator: string;
  sourcePage: string;
  license: string;
  licenseUrl: string;
  commercialUsePermitted: boolean;
  attributionRequired: boolean;
  dateVerified: string;
  /** Actual decoded duration/size of the bundled file (Section 6/41) — not the source page's own (occasionally inaccurate) header claim. */
  durationSeconds: number;
  fileSizeBytes: number;
  notes?: string;
}

export const AMBIENT_AUDIO_SOURCES: AmbientAudioSourceRecord[] = [
  {
    audioReferenceKey: 'ambient_rain_soft',
    filename: 'ambient_rain_soft.mp3',
    title: 'Rain Slowly Passing (Treated Loop)',
    provider: 'Freesound.org',
    creator: 'speakwithanimals',
    sourcePage: 'https://freesound.org/people/speakwithanimals/sounds/525046/',
    license: 'CC0 1.0 Universal (Public Domain Dedication)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUsePermitted: true,
    attributionRequired: false,
    dateVerified: '2026-09-17',
    durationSeconds: 194,
    fileSizeBytes: 3872435,
    notes: 'Re-encoded from the Freesound "hq" preview to 160kbps/44.1kHz MP3 for bundle-size consistency; original preview file had a minor stream artifact near its tail that the re-encode resolved.',
  },
  {
    audioReferenceKey: 'ambient_ocean_swells',
    filename: 'ambient_ocean_swells.mp3',
    title: 'Rolling Ocean Waves – Long Relaxing Swells',
    provider: 'Freesound.org',
    creator: 'bassimat',
    sourcePage: 'https://freesound.org/people/bassimat/sounds/867643/',
    license: 'CC0 1.0 Universal (Public Domain Dedication)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUsePermitted: true,
    attributionRequired: false,
    dateVerified: '2026-09-17',
    durationSeconds: 203,
    fileSizeBytes: 4056860,
  },
  {
    audioReferenceKey: 'ambient_forest_spring',
    filename: 'ambient_forest_spring.mp3',
    title: 'English Spring',
    provider: 'Freesound.org',
    creator: 'GowlerMusic',
    sourcePage: 'https://freesound.org/people/GowlerMusic/sounds/434080/',
    license: 'CC0 1.0 Universal (Public Domain Dedication)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUsePermitted: true,
    attributionRequired: false,
    dateVerified: '2026-09-17',
    durationSeconds: 96,
    fileSizeBytes: 1921088,
    notes: 'Shortest of the five (1:36) — loop point is less seamless than the others at this length; revisit if a longer CC0 forest recording surfaces later.',
  },
  {
    audioReferenceKey: 'ambient_fire_campfire',
    filename: 'ambient_fire_campfire.mp3',
    title: 'Campfire 02',
    provider: 'Freesound.org',
    creator: 'HECKFRICKER',
    sourcePage: 'https://freesound.org/people/HECKFRICKER/sounds/729396/',
    license: 'CC0 1.0 Universal (Public Domain Dedication)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUsePermitted: true,
    attributionRequired: false,
    dateVerified: '2026-09-17',
    durationSeconds: 174,
    fileSizeBytes: 3482688,
  },
  {
    audioReferenceKey: 'ambient_neutral_pad',
    filename: 'ambient_neutral_pad.mp3',
    title: 'Warm Pad Essentials Drone',
    provider: 'Freesound.org',
    creator: 'bassimat',
    sourcePage: 'https://freesound.org/people/bassimat/sounds/854842/',
    license: 'CC0 1.0 Universal (Public Domain Dedication)',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    commercialUsePermitted: true,
    attributionRequired: false,
    dateVerified: '2026-09-17',
    durationSeconds: 300,
    fileSizeBytes: 6001415,
    notes: 'A sustained synth pad texture, not a melodic/composed piece — chosen deliberately to stay distinct from "Meditation Music" content per the product taxonomy.',
  },
];

/** Breathing cues (inhale/hold/exhale tones) were investigated but no coherent, well-matched three-tone set with clear licensing was found — left unavailable per explicit product guidance rather than shipping a mismatched or low-quality set. Revisit in a future phase. */
export const BREATHING_CUE_AUDIO_SOURCES: AmbientAudioSourceRecord[] = [];
