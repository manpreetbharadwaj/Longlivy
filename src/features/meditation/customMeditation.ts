import type { MeditationTemplate } from './models';

export type CustomMeditationAudio = 'sounds' | 'music' | 'silence';

export const MIN_CUSTOM_MINUTES = 1;
export const MAX_CUSTOM_MINUTES = 180;

/** What a saved custom meditation plays - derived from its fields, so templates saved before this feature (no sound, no track) read as a silent timer, exactly as they always ran. */
export function getTemplateAudioMode(template: Pick<MeditationTemplate, 'contentId' | 'backgroundSound'>): CustomMeditationAudio {
  if (template.contentId) return 'music';
  if (template.backgroundSound) return 'sounds';
  return 'silence';
}

/** A whole number of minutes within range, or null for anything else (empty, fractional, negative, too long). */
export function parseCustomMinutes(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return minutes >= MIN_CUSTOM_MINUTES && minutes <= MAX_CUSTOM_MINUTES ? minutes : null;
}

export interface TemplatePlayerParams {
  meditationId: string | null;
  type: 'free';
  durationSeconds: number;
  ambientSoundId: string | null;
  title: string;
  templateId: string;
}

/** The Player session a saved custom meditation starts - the same request shape every other entry point uses. */
export function templateToPlayerParams(template: MeditationTemplate): TemplatePlayerParams {
  return {
    meditationId: template.contentId ?? null,
    type: 'free',
    durationSeconds: template.durationSeconds,
    ambientSoundId: template.backgroundSound ?? null,
    title: template.name,
    templateId: template.id,
  };
}
