import type { TranslationKey, TranslationParams } from '@/localization';
import { MeditationTopic, MeditationType, UnguidedSoundCategory, MEDITATION_TOPICS } from './models';

/**
 * The exact shape of `useTranslation().t` — every label resolver below takes
 * the caller's own live `t` rather than resolving through a module-level
 * static object, so a label is always current for whatever language is
 * active *right now* (Phase 6: a static `Record<Topic, string>` built at
 * import time would go stale the moment the user switches language at
 * runtime, since nothing would ever recompute it).
 */
type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

/** The persisted/internal value stays 'free' — the UI always resolves it to the localized "Unguided" label. */
export function getMeditationModeLabel(mode: MeditationType, t: TFunction): string {
  switch (mode) {
    case 'guided':
      return t('enums.meditationMode.guided');
    case 'free':
      return t('enums.meditationMode.free');
    case 'breathing':
      return t('enums.meditationMode.breathing');
  }
}

export function getMeditationTopicLabel(topic: MeditationTopic, t: TFunction): string {
  switch (topic) {
    case 'morning':
      return t('enums.meditationTopic.morning');
    case 'mindfulness':
      return t('enums.meditationTopic.mindfulness');
    case 'energy':
      return t('enums.meditationTopic.energy');
    case 'focus':
      return t('enums.meditationTopic.focus');
    case 'relaxation':
      return t('enums.meditationTopic.relaxation');
    case 'calm':
      return t('enums.meditationTopic.calm');
    case 'stress_relief':
      return t('enums.meditationTopic.stress_relief');
    case 'sleep':
      return t('enums.meditationTopic.sleep');
  }
}

export function getUnguidedSoundCategoryLabel(category: UnguidedSoundCategory, t: TFunction): string {
  switch (category) {
    case 'meditation_music':
      return t('enums.meditationSoundCategory.meditation_music');
    case 'ambient':
      return t('enums.meditationSoundCategory.ambient');
    case 'nature':
      return t('enums.meditationSoundCategory.nature');
  }
}

/**
 * Centralizes the Categories empty-state sentence (Section 32) as complete,
 * per-language templates rather than concatenating translated fragments —
 * "30-minute Nature Sounds session" doesn't produce natural German by literal
 * word-for-word substitution, so the duration+sound "descriptor" and the
 * surrounding sentence are each their own complete, grammatical template.
 * Deliberately omits the mode from the sentence itself (the mode toggle is
 * already visibly selected on screen) — embedding "Guided"/"Unguided" as a
 * German adjective here would need case/gender inflection the short chip
 * label ("Geführt") doesn't carry, so the sentence just doesn't need it.
 */
export function getMeditationEmptyStateMessage(
  t: TFunction,
  params: { topic: MeditationTopic | null; durationSeconds: number | null; soundCategory: UnguidedSoundCategory | null }
): string {
  const topicLabel = params.topic ? getMeditationTopicLabel(params.topic, t) : null;
  let descriptor: string | null = null;
  if (params.durationSeconds != null && params.soundCategory != null) {
    descriptor = t('meditation.categories.descriptorDurationSound', {
      minutes: Math.round(params.durationSeconds / 60),
      sound: getUnguidedSoundCategoryLabel(params.soundCategory, t),
    });
  } else if (params.durationSeconds != null) {
    descriptor = t('meditation.categories.descriptorDuration', { minutes: Math.round(params.durationSeconds / 60) });
  } else if (params.soundCategory != null) {
    descriptor = t('meditation.categories.descriptorSound', { sound: getUnguidedSoundCategoryLabel(params.soundCategory, t) });
  }
  if (descriptor && topicLabel) return t('meditation.categories.emptyForTopicWithDescriptor', { topic: topicLabel, descriptor });
  if (descriptor) return t('meditation.categories.emptyWithDescriptor', { descriptor });
  if (topicLabel) return t('meditation.categories.emptyForTopic', { topic: topicLabel });
  return t('meditation.categories.emptyGeneric');
}

/**
 * Reference structure only (not wired into any screen yet) — the guided
 * subtypes the client's taxonomy names per topic, kept here as the canonical
 * shape for future content authoring rather than instantiated as ~20 mostly
 * "coming soon" catalog rows in this pass.
 */
export const GUIDED_TOPIC_SUBTYPES: Record<MeditationTopic, string[]> = {
  morning: ['Morning Meditation', 'Gratitude Meditation', 'Positive Thoughts'],
  mindfulness: ['Mindfulness Meditation', 'Body Scan'],
  energy: ['Energy for the Day', 'Motivation Meditation', 'Mental Activation'],
  focus: ['Concentration Meditation', 'Focus Meditation', 'Motivation', 'Energy for the Day', 'Mental Clarity'],
  relaxation: ['Deep Relaxation', 'Progressive Muscle Relaxation', 'Mental Relaxation'],
  calm: ['Meditation for Inner Calm', 'Calmness & Serenity', 'Quieting the Mind', 'Inner Balance'],
  stress_relief: ['Stress Relief Meditation', 'Letting Go of Thoughts'],
  sleep: ['Sleep Meditation', 'Sleep Journey', 'Deep Sleep Meditation', 'Body Scan for Sleep'],
};

// Generic legacy-category → canonical-topic defaults. Applied only when a
// value isn't already a canonical MeditationTopic (see normalizeLegacyMeditationTopic).
// 'Short break', 'Body awareness' and 'Evening' had no single correct topic —
// each legacy item's actual title/intent was inspected once, at authoring
// time, and any that disagree with the generic default below are listed in
// LEGACY_TOPIC_ID_OVERRIDES instead of being guessed at again at runtime.
const LEGACY_TOPIC_DEFAULTS: Record<string, MeditationTopic> = {
  Relaxation: 'relaxation',
  'Stress reduction': 'stress_relief',
  Mindfulness: 'mindfulness',
  'Fall asleep': 'sleep',
  Morning: 'morning',
  Concentration: 'focus',
  'Short break': 'relaxation',
  'Body awareness': 'mindfulness',
  Evening: 'calm',
  // The old 'Breathing' *category* (distinct from the 'breathing' *mode*) was
  // applied to guided content that talked about breath-led calming — 'calm'
  // is the closest generic bucket absent a more specific per-item signal.
  Breathing: 'calm',
};

// Per-item overrides for known legacy catalog rows (by id) whose real
// title/description warrants a different topic than the generic default
// above — e.g. med_10 "Quiet Mind" was tagged "Short break" but its content
// is squarely "quieting the mind", i.e. Calm, not the generic Relaxation
// fallback for that legacy category.
const LEGACY_TOPIC_ID_OVERRIDES: Record<string, MeditationTopic> = {
  med_10: 'calm',
};

/**
 * Deterministic, centralized, idempotent legacy-category migration. A value
 * that's already a canonical MeditationTopic passes through unchanged (safe
 * to call on already-migrated data), so this is fine to apply unconditionally
 * at the repository read boundary rather than sprinkling legacy-string checks
 * across screens. Falls back to 'calm' for any unrecognized legacy string.
 */
export function normalizeLegacyMeditationTopic(value: string, id?: string): MeditationTopic {
  if ((MEDITATION_TOPICS as string[]).includes(value)) return value as MeditationTopic;
  if (id && LEGACY_TOPIC_ID_OVERRIDES[id]) return LEGACY_TOPIC_ID_OVERRIDES[id];
  return LEGACY_TOPIC_DEFAULTS[value] ?? 'calm';
}
