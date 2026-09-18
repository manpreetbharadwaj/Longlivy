import { BreathingScheme, Meditation, MeditationSession } from '@/features/meditation/models';
import { DEMO_USER_ID } from './demoUser';

// category values are canonical MeditationTopic keys (see meditationTaxonomy.ts
// for labels + the legacy-category migration this replaces). Mapping notes for
// the three legacy categories that had no 1:1 canonical equivalent:
//   med_7  was 'Body awareness'  -> mindfulness (body-scan practices are a mindfulness subtype)
//   med_8  was 'Evening'         -> calm (the description reads as winding down/serenity)
//   med_9  was 'Breathing'       -> calm (a guided breath-led *calming* session, not the Breathing *mode*)
//   med_10 was 'Short break'     -> calm ("Quiet Mind" is squarely about quieting the mind, i.e. Calm)
export const MEDITATION_CONTENT_SEED: Meditation[] = [
  { id: 'med_1', title: 'Morning Clarity', description: 'A gentle start to the day with a focus on intention-setting.', category: 'morning', type: 'guided', durationSeconds: 600, audioReference: 'morning_clarity', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_2', title: 'Deep Relaxation', description: 'Full-body relaxation to release physical tension.', category: 'relaxation', type: 'guided', durationSeconds: 900, audioReference: 'deep_relaxation', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_3', title: 'Stress Reset', description: 'A short guided session to help you reset during a stressful day.', category: 'stress_relief', type: 'guided', durationSeconds: 300, audioReference: 'stress_reset', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_4', title: 'Mindful Minutes', description: 'A brief mindfulness practice you can use anywhere.', category: 'mindfulness', type: 'guided', durationSeconds: 180, audioReference: 'mindful_minutes', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_5', title: 'Wind Down', description: 'A calming guided session to help you fall asleep.', category: 'sleep', type: 'guided', durationSeconds: 1200, audioReference: 'wind_down', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_6', title: 'Focus Builder', description: 'Sharpen concentration before deep work.', category: 'focus', type: 'guided', durationSeconds: 600, audioReference: 'focus_builder', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_7', title: 'Body Scan', description: 'A slow, attentive scan through the body.', category: 'mindfulness', type: 'guided', durationSeconds: 900, audioReference: 'body_scan', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_8', title: 'Evening Unwind', description: 'Close the day with a calming reflection.', category: 'calm', type: 'guided', durationSeconds: 300, audioReference: 'evening_unwind', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_9', title: 'Calm Breath', description: 'A steady, breath-led session to settle the nervous system.', category: 'calm', type: 'guided', durationSeconds: 300, audioReference: 'calm_breath', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_10', title: 'Quiet Mind', description: 'A short reset you can fit into any break in the day.', category: 'calm', type: 'guided', durationSeconds: 300, audioReference: 'quiet_mind', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_11', title: 'Serenity Flow', description: 'Let go of tension and settle into stillness.', category: 'relaxation', type: 'guided', durationSeconds: 360, audioReference: 'serenity_flow', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_12', title: 'Full Presence', description: 'A grounding practice for showing up fully in the moment.', category: 'mindfulness', type: 'guided', durationSeconds: 420, audioReference: 'full_presence', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  { id: 'med_13', title: 'Ocean of Calm', description: 'Drift into a peaceful, sleep-ready state.', category: 'sleep', type: 'guided', durationSeconds: 540, audioReference: 'ocean_of_calm', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available' },
  // No real audio yet for Energy — kept as real, browsable catalog metadata
  // (so the topic isn't simply absent from discovery) but gated unplayable.
  { id: 'med_14', title: 'Energy for the Day', description: 'A short activation practice to build motivation and mental energy before your day begins.', category: 'energy', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },

  // --- Guided catalog completion (Phase 2C) -------------------------------
  // GUIDED_TOPIC_SUBTYPES (meditationTaxonomy.ts) is the canonical reference.
  // Subtypes already satisfied by real content above are intentionally NOT
  // duplicated here: Morning Meditation (med_1), Mindfulness Meditation +
  // Body Scan (med_4, med_7), Focus Meditation (med_6), Deep Relaxation
  // (med_2), Quieting the Mind (med_10), Stress Relief Meditation (med_3),
  // Sleep Meditation + Sleep Journey (med_5, med_13). "Motivation" and
  // "Energy for the Day" appear under both Energy and Focus in the client's
  // subtype list — each is represented once (under Energy, alongside med_14)
  // rather than duplicated as near-identical rows under both topics.
  // Everything below is real catalog metadata with no audio yet.
  { id: 'med_15', title: 'Gratitude Meditation', description: 'A short practice to notice what you’re grateful for as the day begins.', category: 'morning', type: 'guided', durationSeconds: 300, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_16', title: 'Positive Thoughts', description: 'Guided reflection to start the day with a steadier, more positive mindset.', category: 'morning', type: 'guided', durationSeconds: 300, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_17', title: 'Motivation Meditation', description: 'Build motivation and drive before a demanding day.', category: 'energy', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_18', title: 'Mental Activation', description: 'A short, energizing practice to wake up the mind.', category: 'energy', type: 'guided', durationSeconds: 300, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_19', title: 'Concentration Meditation', description: 'Train sustained attention before focused work.', category: 'focus', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_20', title: 'Mental Clarity', description: 'Clear mental clutter and sharpen your thinking.', category: 'focus', type: 'guided', durationSeconds: 420, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_21', title: 'Progressive Muscle Relaxation', description: 'Systematically release tension, muscle group by muscle group.', category: 'relaxation', type: 'guided', durationSeconds: 900, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_22', title: 'Mental Relaxation', description: 'Let go of mental tension without a physical relaxation focus.', category: 'relaxation', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_23', title: 'Meditation for Inner Calm', description: 'Settle into a steady, grounded sense of calm.', category: 'calm', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_24', title: 'Calmness & Serenity', description: 'A gentle practice for quiet, unhurried serenity.', category: 'calm', type: 'guided', durationSeconds: 480, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_25', title: 'Inner Balance', description: 'Restore a sense of balance and steadiness within.', category: 'calm', type: 'guided', durationSeconds: 480, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_26', title: 'Letting Go of Thoughts', description: 'Practice releasing repetitive or stressful thoughts as they arise.', category: 'stress_relief', type: 'guided', durationSeconds: 420, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_27', title: 'Deep Sleep Meditation', description: 'A longer, deeply calming practice to prepare for sleep.', category: 'sleep', type: 'guided', durationSeconds: 1200, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },
  { id: 'med_28', title: 'Body Scan for Sleep', description: 'A slow body scan designed to ease you toward sleep.', category: 'sleep', type: 'guided', durationSeconds: 900, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon' },

  // --- Unguided (type: 'free', product-facing "Unguided") catalog --------
  // Real playable rows reuse the existing 13 meditation-music tracks (no new
  // audio assets) — each track used at most once here, distinct from its
  // Guided-catalog usage above. durationSeconds is fixed to one of the
  // canonical MEDITATION_DURATION_PRESETS_SECONDS values per row rather than
  // the track's own length: for Unguided content the *session* duration is
  // authoritative and the (typically shorter) track loops to fill it, same
  // as any other Unguided session — see useMeditationAudioSession, unchanged.
  { id: 'med_29', title: 'Morning Stillness', description: 'Unguided instrumental music for a quiet start to the day.', category: 'morning', type: 'free', durationSeconds: 900, audioReference: 'morning_clarity', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_30', title: 'Present Moment', description: 'Unguided instrumental music for sitting with the present moment.', category: 'mindfulness', type: 'free', durationSeconds: 300, audioReference: 'full_presence', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_31', title: 'Focus Ambience', description: 'Unguided instrumental music to hold attention during focused work.', category: 'focus', type: 'free', durationSeconds: 1800, audioReference: 'focus_builder', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_32', title: 'Deep Rest', description: 'Unguided instrumental music for full-body relaxation.', category: 'relaxation', type: 'free', durationSeconds: 1800, audioReference: 'deep_relaxation', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_33', title: 'Quiet Space', description: 'Unguided instrumental music for a calm, unhurried moment.', category: 'calm', type: 'free', durationSeconds: 900, audioReference: 'quiet_mind', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_34', title: 'Letting Go', description: 'Unguided instrumental music to ease a stressful moment.', category: 'stress_relief', type: 'free', durationSeconds: 300, audioReference: 'stress_reset', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  { id: 'med_35', title: 'Sleep Sounds', description: 'Unguided instrumental music to drift off to.', category: 'sleep', type: 'free', durationSeconds: 2700, audioReference: 'wind_down', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'meditation_music' },
  // Energy has no meditation-music track that genuinely fits an activating
  // mood — kept visible as catalog structure rather than silently absent.
  { id: 'med_36', title: 'Energising Flow', description: 'Unguided music for an activating, energizing session.', category: 'energy', type: 'free', durationSeconds: 900, language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'coming_soon', soundCategory: 'meditation_music' },

  // Ambient/Nature: Phase 5 added five real CC0 recordings (see
  // licensing/audioSources.ts), each reused here as the PRIMARY track for a
  // genuinely ambient-only Unguided session — same resolution path as any
  // other Unguided row (Section 29-31), no separate "no primary track" mode
  // needed. visualTheme is set explicitly where Section 32 named a specific
  // theme; the other two are left on their topic defaults, which already
  // resolve correctly (calm→calm, sleep→night).
  { id: 'med_37', title: 'Rain at Night', description: 'Gentle night rain to accompany a longer sleep session.', category: 'sleep', type: 'free', durationSeconds: 2700, audioReference: 'ambient_rain_soft', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'nature', visualTheme: 'night' },
  { id: 'med_38', title: 'Ocean Calm', description: 'Steady ocean waves for deep relaxation.', category: 'relaxation', type: 'free', durationSeconds: 1800, audioReference: 'ambient_ocean_swells', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'nature', visualTheme: 'ocean' },
  { id: 'med_39', title: 'Soft Evening Atmosphere', description: 'A gentle ambient bed for unwinding into calm.', category: 'calm', type: 'free', durationSeconds: 1800, audioReference: 'ambient_neutral_pad', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'ambient' },
  { id: 'med_40', title: 'Forest Reset', description: 'Birdsong and forest air to reset during a stressful day.', category: 'stress_relief', type: 'free', durationSeconds: 900, audioReference: 'ambient_forest_spring', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'nature', visualTheme: 'forest' },
  { id: 'med_41', title: 'Night Ambience', description: 'A quiet ambient bed for a full night’s sleep session.', category: 'sleep', type: 'free', durationSeconds: 3600, audioReference: 'ambient_neutral_pad', language: 'en', status: 'published', version: '1.0', source: 'Solace Studio', availability: 'available', soundCategory: 'ambient' },
];

export const BREATHING_SCHEMES_SEED: BreathingScheme[] = [
  { id: 'breath_box', name: 'Box Breathing', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4, secondHoldSeconds: 4, repetitions: 8, description: 'Equal-length inhale, hold, exhale and hold. Often used for calm focus.' },
  { id: 'breath_478', name: '4-7-8 Breathing', inhaleSeconds: 4, holdSeconds: 7, exhaleSeconds: 8, secondHoldSeconds: 0, repetitions: 6, description: 'A longer exhale pattern some people use before sleep.' },
  { id: 'breath_calm', name: 'Calming Breath', inhaleSeconds: 4, holdSeconds: 0, exhaleSeconds: 6, secondHoldSeconds: 0, repetitions: 10, description: 'A simple longer-exhale pattern for relaxation.' },
];

function daysAgo(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MEDITATION_SESSION_SEED: MeditationSession[] = Array.from({ length: 8 }).map((_, i) => {
  const start = daysAgo(i, 21);
  const durationSec = [600, 300, 900, 600, 180, 600, 300, 1200][i % 8];
  return {
    id: `med_session_seed_${i}`,
    userId: DEMO_USER_ID,
    meditationId: MEDITATION_CONTENT_SEED[i % MEDITATION_CONTENT_SEED.length].id,
    meditationTitle: MEDITATION_CONTENT_SEED[i % MEDITATION_CONTENT_SEED.length].title,
    type: 'guided',
    templateId: null,
    plannedDurationSeconds: durationSec,
    activeDurationSeconds: durationSec,
    pausedDurationSeconds: 0,
    startedAt: start,
    endedAt: start,
    status: 'completed',
    events: [],
    createdAt: start,
  } satisfies MeditationSession;
});
