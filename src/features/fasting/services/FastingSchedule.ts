/**
 * Pure fasting-schedule arithmetic - no React, no Redux, no storage.
 *
 * A schedule is a fasting model plus the local time of day the fast begins.
 * Everything the UI shows (when fasting begins, how long it lasts, when the
 * eating window opens and closes, what comes next) is derived from those three
 * numbers and the current instant, on the device's local calendar - never
 * stored, so it cannot drift out of step with the model or the start time.
 *
 * Daily models (14:10, 16:8, custom splits...) repeat: fasting + eating is a
 * 24-hour cycle that begins at the same local clock time every day. Longer
 * fasts (24h+) are a single window with no eating window and no repeat.
 *
 * Arithmetic for a daily cycle is done on the local wall clock
 * (`new Date(y, m, d, 0, minutes)`), so "fasting begins 20:00, eating window
 * begins 12:00" holds across midnight and across a daylight-saving change -
 * only the elapsed hours on those two days per year differ by one. A
 * single long fast is measured in real hours instead.
 */

export const MINUTES_PER_DAY = 24 * 60;
const MS_PER_HOUR = 3_600_000;

export const MIN_CUSTOM_FASTING_HOURS = 1;
export const MAX_CUSTOM_FASTING_HOURS = 23;
export const MAX_SINGLE_FAST_HOURS = 168;

export interface FastingSchedule {
  fastingHours: number;
  /** 0 marks a single fast (no eating window, no repeat). */
  eatingHours: number;
  /** Minutes after local midnight at which fasting begins, 0..1439. */
  startMinutes: number;
}

export type ScheduleError = 'start_time' | 'fasting_hours' | 'eating_hours' | 'cycle_length';

export function isDailyCycle(schedule: Pick<FastingSchedule, 'eatingHours'>): boolean {
  return schedule.eatingHours > 0;
}

/** Null when the schedule is usable; otherwise the first rule it breaks. */
export function validateSchedule(schedule: FastingSchedule): ScheduleError | null {
  if (!Number.isInteger(schedule.startMinutes) || schedule.startMinutes < 0 || schedule.startMinutes >= MINUTES_PER_DAY) return 'start_time';
  if (!Number.isFinite(schedule.fastingHours) || schedule.fastingHours <= 0) return 'fasting_hours';
  if (!Number.isFinite(schedule.eatingHours) || schedule.eatingHours < 0) return 'eating_hours';
  if (schedule.eatingHours === 0) return schedule.fastingHours > MAX_SINGLE_FAST_HOURS ? 'fasting_hours' : null;
  if (schedule.fastingHours < MIN_CUSTOM_FASTING_HOURS || schedule.fastingHours > MAX_CUSTOM_FASTING_HOURS) return 'fasting_hours';
  if (schedule.eatingHours < 1) return 'eating_hours';
  if (schedule.fastingHours + schedule.eatingHours !== 24) return 'cycle_length';
  return null;
}

/** The eating window that completes a daily cycle around `fastingHours`, or null if that many hours can't form one. */
export function splitForFastingHours(fastingHours: number): { fastingHours: number; eatingHours: number } | null {
  if (!Number.isInteger(fastingHours) || fastingHours < MIN_CUSTOM_FASTING_HOURS || fastingHours > MAX_CUSTOM_FASTING_HOURS) return null;
  return { fastingHours, eatingHours: 24 - fastingHours };
}

/** Editing either half of a custom split keeps the other at whatever completes 24 hours. */
export function splitForEatingHours(eatingHours: number): { fastingHours: number; eatingHours: number } | null {
  if (!Number.isInteger(eatingHours)) return null;
  return splitForFastingHours(24 - eatingHours);
}

export function parseTimeOfDay(text: string): number | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(text.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatTimeOfDay(minutes: number): string {
  const m = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** The local instant `minutes` after midnight of `day`'s calendar date; minutes past 1440 roll into the following days. */
function atMinutes(day: Date, dayOffset: number, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + dayOffset, 0, minutes);
}

/** `date` plus a number of local wall-clock hours (so 12:00 + 8h is 20:00 even across a clock change). */
export function addWallClockHours(date: Date, hours: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + Math.round(hours * 60), date.getSeconds(), date.getMilliseconds());
}

/** Whole local calendar days from `from` to `to` (0 = same date, 1 = the next date, -1 = the previous one). */
export function calendarDayDifference(to: Date, from: Date): number {
  const a = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  const b = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((a - b) / (24 * MS_PER_HOUR));
}

/**
 * Some Android builds resolve the device's timezone to a raw UTC-offset
 * string (e.g. "GMT+05:30") instead of a named IANA zone - typically when
 * "Automatic timezone" is off and the user picked a generic offset rather
 * than a city. The backend's timezone validation only accepts canonical
 * IANA identifiers, so a raw offset is rejected outright. Every real IANA
 * zone is either "UTC" or a "Region/City" pair, so anything else falls
 * back to "UTC" rather than sending a value the server will reject.
 */
export function getLocalTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone === 'UTC' || zone?.includes('/') ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

export interface FastOccurrence {
  start: Date;
  /** Fasting ends here: the eating window opens (or, for a single fast, the goal is reached). */
  fastEnd: Date;
}

export function occurrenceStartingOn(schedule: FastingSchedule, day: Date, dayOffset = 0): FastOccurrence {
  const start = atMinutes(day, dayOffset, schedule.startMinutes);
  const fastEnd = isDailyCycle(schedule)
    ? atMinutes(day, dayOffset, schedule.startMinutes + schedule.fastingHours * 60)
    : new Date(start.getTime() + schedule.fastingHours * MS_PER_HOUR);
  return { start, fastEnd };
}

/** The most recent occurrence whose start is at or before `now`. */
export function latestOccurrenceAtOrBefore(schedule: FastingSchedule, now: Date): FastOccurrence {
  const today = occurrenceStartingOn(schedule, now, 0);
  return today.start.getTime() <= now.getTime() ? today : occurrenceStartingOn(schedule, now, -1);
}

/** The first occurrence that starts strictly after `after`. */
export function nextOccurrenceAfter(schedule: FastingSchedule, after: Date): FastOccurrence {
  const today = occurrenceStartingOn(schedule, after, 0);
  return today.start.getTime() > after.getTime() ? today : occurrenceStartingOn(schedule, after, 1);
}

export interface StartResolution {
  /** 'in_progress': the fast's scheduled window is open right now. 'upcoming': the next one starts later. */
  kind: 'in_progress' | 'upcoming';
  occurrence: FastOccurrence;
}

/** What starting this schedule "now" means: join the window that is already open, or wait for the next. */
export function resolveStart(schedule: FastingSchedule, now: Date): StartResolution {
  const latest = latestOccurrenceAtOrBefore(schedule, now);
  if (now.getTime() < latest.fastEnd.getTime()) return { kind: 'in_progress', occurrence: latest };
  return { kind: 'upcoming', occurrence: nextOccurrenceAfter(schedule, now) };
}

/** The four facts the setup screen previews, all derived from the schedule and the current instant. */
export interface ScheduleSummary {
  fastingBegins: Date;
  fastingHours: number;
  eatingBegins: Date;
  /** Hours of the eating window (0 for a single fast). */
  eatingHours: number;
  /** When the next fasting phase after this one begins; null for a single fast. */
  nextFastingBegins: Date | null;
  inProgress: boolean;
}

export function summarizeSchedule(schedule: FastingSchedule, now: Date): ScheduleSummary {
  const { kind, occurrence } = resolveStart(schedule, now);
  return {
    fastingBegins: occurrence.start,
    fastingHours: schedule.fastingHours,
    eatingBegins: occurrence.fastEnd,
    eatingHours: schedule.eatingHours,
    nextFastingBegins: isDailyCycle(schedule) ? nextOccurrenceAfter(schedule, occurrence.fastEnd).start : null,
    inProgress: kind === 'in_progress',
  };
}

/** A fasting window as a stored session describes it. */
export interface FastWindow {
  start: Date;
  end: Date;
  /** Hours of eating window that follow this fast; 0 or absent means a single fast. */
  eatingHours: number;
}

export type CyclePhase = 'fasting' | 'eating' | 'idle';

export interface CycleState {
  phase: CyclePhase;
  /** A single fast that has run past its planned end and is still open. */
  goalReached: boolean;
  phaseStart: Date | null;
  phaseEnd: Date | null;
  elapsedMs: number;
  remainingMs: number;
  /** 0..1 through the current phase (idle: 0). */
  progress: number;
  fastStart: Date | null;
  fastEnd: Date | null;
  eatingStart: Date | null;
  eatingEnd: Date | null;
  nextFastStart: Date | null;
  /** The next change of phase - what the timer counts toward. Null when nothing is scheduled. */
  nextTransition: { kind: 'eating_begins' | 'fasting_begins' | 'goal_reached'; at: Date } | null;
}

const IDLE: CycleState = {
  phase: 'idle',
  goalReached: false,
  phaseStart: null,
  phaseEnd: null,
  elapsedMs: 0,
  remainingMs: 0,
  progress: 0,
  fastStart: null,
  fastEnd: null,
  eatingStart: null,
  eatingEnd: null,
  nextFastStart: null,
  nextTransition: null,
};

function progressThrough(start: Date, end: Date, now: Date) {
  const total = Math.max(end.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - start.getTime(), 0);
  return { elapsedMs, remainingMs: end.getTime() - now.getTime(), progress: elapsedMs / total };
}

/**
 * Where the user is in their fasting cycle right now.
 *
 * `fast` is the fast currently open (a session that has not been finalized);
 * `lastFast` the most recently finished one, used only to keep showing the
 * eating window that follows it. The next fasting start always comes from the
 * *schedule* (falling back to the fast's own eating hours when there is none),
 * which is what makes an edited schedule apply from the next cycle.
 */
export function computeCycleState(args: { now: Date; schedule: FastingSchedule | null; fast: FastWindow | null; lastFast?: FastWindow | null }): CycleState {
  const { now, schedule, fast, lastFast } = args;
  const nowMs = now.getTime();
  const daily = schedule != null && isDailyCycle(schedule);

  const eatingAfter = (window: FastWindow) => {
    if (window.eatingHours <= 0) return null;
    const start = window.end;
    const end = daily ? nextOccurrenceAfter(schedule!, start).start : addWallClockHours(start, window.eatingHours);
    return { start, end };
  };

  const fromEating = (window: FastWindow, eating: { start: Date; end: Date }): CycleState => ({
    ...IDLE,
    phase: 'eating',
    phaseStart: eating.start,
    phaseEnd: eating.end,
    ...progressThrough(eating.start, eating.end, now),
    fastStart: window.start,
    fastEnd: window.end,
    eatingStart: eating.start,
    eatingEnd: eating.end,
    nextFastStart: eating.end,
    nextTransition: { kind: 'fasting_begins', at: eating.end },
  });

  const idle = (): CycleState => {
    if (!daily) return IDLE;
    const next = nextOccurrenceAfter(schedule!, now);
    return { ...IDLE, nextFastStart: next.start, nextTransition: { kind: 'fasting_begins', at: next.start } };
  };

  if (fast) {
    const eating = eatingAfter(fast);
    if (nowMs < fast.end.getTime()) {
      return {
        ...IDLE,
        phase: 'fasting',
        phaseStart: fast.start,
        phaseEnd: fast.end,
        ...progressThrough(fast.start, fast.end, now),
        fastStart: fast.start,
        fastEnd: fast.end,
        eatingStart: eating?.start ?? null,
        eatingEnd: eating?.end ?? null,
        nextFastStart: eating?.end ?? null,
        nextTransition: { kind: eating ? 'eating_begins' : 'goal_reached', at: fast.end },
      };
    }
    if (eating) return nowMs < eating.end.getTime() ? fromEating(fast, eating) : idle();
    return {
      ...IDLE,
      phase: 'fasting',
      goalReached: true,
      phaseStart: fast.start,
      phaseEnd: fast.end,
      ...progressThrough(fast.start, fast.end, now),
      fastStart: fast.start,
      fastEnd: fast.end,
    };
  }

  if (lastFast) {
    const eating = eatingAfter(lastFast);
    if (eating && nowMs >= eating.start.getTime() && nowMs < eating.end.getTime()) return fromEating(lastFast, eating);
  }
  return idle();
}

/** Whether the fast's own length calls for day-by-day framing ("Day 2") - never for a fast that fits inside one day. */
export function isMultiDayFast(fastingHours: number): boolean {
  return fastingHours > 24;
}

export type ScheduleEditBlock = 'no_fast_in_progress' | 'would_start_in_future' | 'would_already_be_over' | 'extended';

export interface ScheduleEditPlan {
  /** Whether "apply to my current fast too" is a coherent option right now. */
  canApplyToCurrent: boolean;
  blockedBecause: ScheduleEditBlock | null;
  /** What the current fast would become if the edit were applied to it. Null when there is no fast in progress. */
  currentIfApplied: FastOccurrence | null;
  /** When the next fast begins under the edited schedule - what "next cycle" means. Null for a single-fast model. */
  nextFastStart: Date | null;
}

/**
 * The rule for editing a schedule (model or start time):
 *
 *  - A fast already in progress keeps the window it began with. That window is
 *    what really happened, and history, streaks and statistics are built from
 *    it, so a change made mid-fast applies from the NEXT cycle by default.
 *  - The user may choose to also re-plan the current fast (typically to fix a
 *    start time entered wrong). That is only coherent when the edited schedule's
 *    matching window has already begun and not yet ended - a fast cannot be
 *    moved into the future, and cannot be moved so it would already be over -
 *    and when the fast has not been extended, since an extension is a decision
 *    the edit would silently discard.
 *  - Finished sessions are never touched.
 *
 * The "matching window" is the edited schedule's occurrence whose start is
 * closest to the current fast's actual start.
 */
export function planScheduleEdit(args: { now: Date; current: { start: Date; end: Date; extensionCount: number } | null; next: FastingSchedule }): ScheduleEditPlan {
  const { now, current, next } = args;
  const daily = isDailyCycle(next);

  if (!current) {
    return {
      canApplyToCurrent: false,
      blockedBecause: 'no_fast_in_progress',
      currentIfApplied: null,
      nextFastStart: daily ? nextOccurrenceAfter(next, now).start : null,
    };
  }

  const candidates = [-1, 0, 1].map((offset) => occurrenceStartingOn(next, current.start, offset));
  const matching = candidates.reduce((best, candidate) =>
    Math.abs(candidate.start.getTime() - current.start.getTime()) < Math.abs(best.start.getTime() - current.start.getTime()) ? candidate : best
  );

  let blockedBecause: ScheduleEditBlock | null = null;
  if (current.extensionCount > 0) blockedBecause = 'extended';
  else if (matching.start.getTime() > now.getTime()) blockedBecause = 'would_start_in_future';
  else if (matching.fastEnd.getTime() <= now.getTime()) blockedBecause = 'would_already_be_over';

  const canApplyToCurrent = blockedBecause === null;
  const fastEndAfterEdit = canApplyToCurrent ? matching.fastEnd : current.end;
  return {
    canApplyToCurrent,
    blockedBecause,
    currentIfApplied: matching,
    nextFastStart: daily ? nextOccurrenceAfter(next, fastEndAfterEdit).start : null,
  };
}
