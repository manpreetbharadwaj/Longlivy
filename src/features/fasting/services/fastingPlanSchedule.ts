import { FASTING_METHODS, FastingCategory, FastingMethodId, FastingPlan, FastingSession } from '../models';
import { FastingSchedule, formatTimeOfDay, parseTimeOfDay, validateSchedule } from './FastingSchedule';

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

/** "16:8" for a daily model (presets and custom splits alike), "72 hours"/"30h" for a single fast. */
export function formatModelLabel(input: { method: FastingMethodId; fastingHours: number; eatingHours: number }): string {
  if (input.eatingHours > 0) return `${input.fastingHours}:${input.eatingHours}`;
  const preset = FASTING_METHODS.find((m) => m.id === input.method && m.id !== 'individual');
  return preset ? preset.name : `${input.fastingHours} hours`;
}

/**
 * The model label for a stored fast, from the length it was *planned* at - an extension makes a 16:8 fast run longer,
 * it does not turn it into an 18:8 one. (`plannedDuration` includes extensions; `originalPlannedEnd` does not.)
 */
export function sessionModelLabel(session: Pick<FastingSession, 'method' | 'startTimestamp' | 'originalPlannedEnd' | 'eatingHours'>): string {
  const fastingHours = Math.round((new Date(session.originalPlannedEnd).getTime() - new Date(session.startTimestamp).getTime()) / 3_600_000);
  return formatModelLabel({ method: session.method, fastingHours, eatingHours: session.eatingHours ?? 0 });
}
