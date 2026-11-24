import type { TranslationKey, TranslationParams } from '@/localization';
import { FASTING_METHODS, FastingCategory, FastingMethodId, FastingPlan, FastingSession } from '../models';
import { FastingSchedule, formatTimeOfDay, parseTimeOfDay, validateSchedule } from './FastingSchedule';

type TFunction = (key: TranslationKey, params?: TranslationParams) => string;

/** The schedule a stored plan describes, or null when it can't be read as a valid one. Plans saved before custom splits existed carry only `method`, so hours fall back to that method's table. */
export function scheduleFromPlan(plan: FastingPlan): FastingSchedule | null {
  const method = FASTING_METHODS.find((m) => m.id === plan.method);
  const startMinutes = parseTimeOfDay(plan.startTime);
  if (startMinutes == null) return null;
  const schedule: FastingSchedule = {
    fastingHours: plan.fastingHours ?? method?.fastingHours ?? 0,
    eatingHours: plan.eatingHours ?? method?.eatingHours ?? 0,
    startMinutes,
  };
  return validateSchedule(schedule) === null ? schedule : null;
}

export function categoryForMethod(methodId: FastingMethodId): FastingCategory {
  return FASTING_METHODS.find((m) => m.id === methodId)?.category ?? 'individual';
}

/** The plan fields that follow from a chosen model and schedule - `endTime` (when the eating window opens) is always derived, never entered. */
export function planFieldsForSchedule(methodId: FastingMethodId, schedule: FastingSchedule) {
  return {
    method: methodId,
    category: categoryForMethod(methodId),
    startTime: formatTimeOfDay(schedule.startMinutes),
    endTime: formatTimeOfDay(schedule.startMinutes + schedule.fastingHours * 60),
    fastingHours: schedule.fastingHours,
    eatingHours: schedule.eatingHours,
  };
}

/** "16:8" for a daily model (presets and custom splits alike), "72 hours"/"30h" for a single fast. The "X:Y" ratio names are language-neutral and not translated; only the hour-count fallback is. */
export function formatModelLabel(input: { method: FastingMethodId; fastingHours: number; eatingHours: number }, t: TFunction): string {
  if (input.eatingHours > 0) return `${input.fastingHours}:${input.eatingHours}`;
  const preset = FASTING_METHODS.find((m) => m.id === input.method && m.id !== 'individual');
  return preset ? t('common.duration.hoursLabel', { hours: preset.fastingHours }) : t('common.duration.hoursLabel', { hours: input.fastingHours });
}

/**
 * The model label for a stored fast, from the length it was *planned* at - an extension makes a 16:8 fast run longer,
 * it does not turn it into an 18:8 one. (`plannedDuration` includes extensions; `originalPlannedEnd` does not.)
 */
export function sessionModelLabel(session: Pick<FastingSession, 'method' | 'startTimestamp' | 'originalPlannedEnd' | 'eatingHours'>, t: TFunction): string {
  const fastingHours = Math.round((new Date(session.originalPlannedEnd).getTime() - new Date(session.startTimestamp).getTime()) / 3_600_000);
  return formatModelLabel({ method: session.method, fastingHours, eatingHours: session.eatingHours ?? 0 }, t);
}

/** The method picker's own display name — the "X:Y" ratio presets are language-neutral; the hour-count and "Individual fasting" names are translated. */
export function fastingMethodName(methodId: FastingMethodId, t: TFunction): string {
  const method = FASTING_METHODS.find((m) => m.id === methodId);
  if (!method) return '';
  if (methodId === 'individual') return t('enums.fastingMethod.individual');
  if (method.eatingHours > 0) return method.name;
  return t('common.duration.hoursLabel', { hours: method.fastingHours });
}

/** The method picker's short explanation copy for the given method. */
export function fastingMethodShortExplanation(methodId: FastingMethodId, t: TFunction): string {
  switch (methodId) {
    case '14:10':
      return t('fasting.methodExplanations.14_10');
    case '16:8':
      return t('fasting.methodExplanations.16_8');
    case '18:6':
      return t('fasting.methodExplanations.18_6');
    case '20:4':
      return t('fasting.methodExplanations.20_4');
    case '24h':
      return t('fasting.methodExplanations.24h');
    case '36h':
      return t('fasting.methodExplanations.36h');
    case '48h':
      return t('fasting.methodExplanations.48h');
    case '72h':
      return t('fasting.methodExplanations.72h');
    case '96h':
      return t('fasting.methodExplanations.96h');
    case 'individual':
      return t('fasting.methodExplanations.individual');
  }
}
