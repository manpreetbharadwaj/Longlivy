import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FastingSchedule,
  addWallClockHours,
  calendarDayDifference,
  computeCycleState,
  formatTimeOfDay,
  isMultiDayFast,
  latestOccurrenceAtOrBefore,
  nextOccurrenceAfter,
  occurrenceStartingOn,
  parseTimeOfDay,
  planScheduleEdit,
  resolveStart,
  splitForEatingHours,
  splitForFastingHours,
  summarizeSchedule,
  validateSchedule,
} from '../src/features/fasting/services/FastingSchedule';

const HOUR = 3_600_000;

/** Runs `fn` with the process time zone pinned - the schedule maths is defined on the device's local calendar, so it must be tested against a known one. */
function inZone(zone: string, fn: () => void) {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try {
    fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const clock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const sixteenEight: FastingSchedule = { fastingHours: 16, eatingHours: 8, startMinutes: 20 * 60 };

test('a valid custom split must be a 24-hour cycle with both halves present', () => {
  assert.equal(validateSchedule(sixteenEight), null);
  assert.equal(validateSchedule({ fastingHours: 15, eatingHours: 9, startMinutes: 0 }), null);
  assert.equal(validateSchedule({ fastingHours: 15, eatingHours: 8, startMinutes: 0 }), 'cycle_length');
  assert.equal(validateSchedule({ fastingHours: 0, eatingHours: 24, startMinutes: 0 }), 'fasting_hours');
  assert.equal(validateSchedule({ fastingHours: 24, eatingHours: 1, startMinutes: 0 }), 'fasting_hours');
  assert.equal(validateSchedule({ fastingHours: 16, eatingHours: 8, startMinutes: 1440 }), 'start_time');
  assert.equal(validateSchedule({ fastingHours: 16, eatingHours: 8, startMinutes: -1 }), 'start_time');
  assert.equal(validateSchedule({ fastingHours: 16, eatingHours: -8, startMinutes: 0 }), 'eating_hours');
});

test('a longer fast is a single window with no eating hours', () => {
  assert.equal(validateSchedule({ fastingHours: 72, eatingHours: 0, startMinutes: 8 * 60 }), null);
  assert.equal(validateSchedule({ fastingHours: 200, eatingHours: 0, startMinutes: 0 }), 'fasting_hours');
});

test('editing one half of a custom split moves the other to keep 24 hours', () => {
  assert.deepEqual(splitForFastingHours(15), { fastingHours: 15, eatingHours: 9 });
  assert.deepEqual(splitForEatingHours(6), { fastingHours: 18, eatingHours: 6 });
  assert.equal(splitForFastingHours(24), null);
  assert.equal(splitForFastingHours(0), null);
  assert.equal(splitForEatingHours(0), null);
  assert.equal(splitForFastingHours(15.5), null);
});

test('times of day parse and format', () => {
  assert.equal(parseTimeOfDay('20:00'), 1200);
  assert.equal(parseTimeOfDay('7:05'), 425);
  assert.equal(parseTimeOfDay('24:00'), null);
  assert.equal(parseTimeOfDay('12:60'), null);
  assert.equal(parseTimeOfDay('noon'), null);
  assert.equal(formatTimeOfDay(1200), '20:00');
  assert.equal(formatTimeOfDay(425), '07:05');
  assert.equal(formatTimeOfDay(1440 + 30), '00:30');
});

test('16:8 from 20:00: fasting crosses midnight and the eating window opens at 12:00 the next day', () => {
  inZone('Europe/Berlin', () => {
    const occurrence = occurrenceStartingOn(sixteenEight, at(2026, 9, 28));
    assert.equal(occurrence.start.getTime(), at(2026, 9, 28, 20).getTime());
    assert.equal(occurrence.fastEnd.getTime(), at(2026, 9, 29, 12).getTime());
    assert.equal(occurrence.fastEnd.getTime() - occurrence.start.getTime(), 16 * HOUR);
  });
});

test('the current window is found correctly just after midnight (the date has changed but the fast has not ended)', () => {
  inZone('Europe/Berlin', () => {
    const latest = latestOccurrenceAtOrBefore(sixteenEight, at(2026, 9, 29, 0, 30));
    assert.equal(latest.start.getTime(), at(2026, 9, 28, 20).getTime());
    const resolution = resolveStart(sixteenEight, at(2026, 9, 29, 0, 30));
    assert.equal(resolution.kind, 'in_progress');
  });
});

test('summary for a start time inside the eating window shows the upcoming fast and the next one after it', () => {
  inZone('Europe/Berlin', () => {
    const summary = summarizeSchedule(sixteenEight, at(2026, 9, 28, 14));
    assert.equal(summary.inProgress, false);
    assert.equal(summary.fastingBegins.getTime(), at(2026, 9, 28, 20).getTime());
    assert.equal(summary.fastingHours, 16);
    assert.equal(summary.eatingBegins.getTime(), at(2026, 9, 29, 12).getTime());
    assert.equal(summary.eatingHours, 8);
    assert.equal(summary.nextFastingBegins!.getTime(), at(2026, 9, 29, 20).getTime());
  });
});

test('summary for a start time whose window is already open joins it', () => {
  inZone('Europe/Berlin', () => {
    const summary = summarizeSchedule(sixteenEight, at(2026, 9, 28, 22));
    assert.equal(summary.inProgress, true);
    assert.equal(summary.fastingBegins.getTime(), at(2026, 9, 28, 20).getTime());
    assert.equal(summary.nextFastingBegins!.getTime(), at(2026, 9, 29, 20).getTime());
  });
});

test('live state during the fast: current phase, progress, and the next transition', () => {
  inZone('Europe/Berlin', () => {
    const fast = { start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 12), eatingHours: 8 };
    const state = computeCycleState({ now: at(2026, 9, 29, 0, 30), schedule: sixteenEight, fast });
    assert.equal(state.phase, 'fasting');
    assert.equal(state.goalReached, false);
    assert.equal(state.elapsedMs, 4.5 * HOUR);
    assert.equal(state.remainingMs, 11.5 * HOUR);
    assert.ok(Math.abs(state.progress - 4.5 / 16) < 1e-9);
    assert.equal(state.nextTransition!.kind, 'eating_begins');
    assert.equal(state.nextTransition!.at.getTime(), at(2026, 9, 29, 12).getTime());
    assert.equal(state.eatingStart!.getTime(), at(2026, 9, 29, 12).getTime());
    assert.equal(state.eatingEnd!.getTime() - state.eatingStart!.getTime(), 8 * HOUR);
    assert.equal(state.nextFastStart!.getTime(), at(2026, 9, 29, 20).getTime());
  });
});

test('once the fast is over the eating window is shown from the finished session, counting down to the next fast', () => {
  inZone('Europe/Berlin', () => {
    const lastFast = { start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 12), eatingHours: 8 };
    const state = computeCycleState({ now: at(2026, 9, 29, 13), schedule: sixteenEight, fast: null, lastFast });
    assert.equal(state.phase, 'eating');
    assert.equal(state.remainingMs, 7 * HOUR);
    assert.equal(state.nextTransition!.kind, 'fasting_begins');
    assert.equal(state.nextTransition!.at.getTime(), at(2026, 9, 29, 20).getTime());
    assert.ok(Math.abs(state.progress - 1 / 8) < 1e-9);
  });
});

test('an open fast whose goal has passed, but which is still awaiting settlement, already reads as the eating window', () => {
  inZone('Europe/Berlin', () => {
    const fast = { start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 12), eatingHours: 8 };
    const state = computeCycleState({ now: at(2026, 9, 29, 12, 5), schedule: sixteenEight, fast });
    assert.equal(state.phase, 'eating');
  });
});

test('after the eating window closes with nothing running, the state is idle and points at the next start (across the date change)', () => {
  inZone('Europe/Berlin', () => {
    const lastFast = { start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 12), eatingHours: 8 };
    const state = computeCycleState({ now: at(2026, 9, 29, 21), schedule: sixteenEight, fast: null, lastFast });
    assert.equal(state.phase, 'idle');
    assert.equal(state.nextFastStart!.getTime(), at(2026, 9, 30, 20).getTime());
  });
});

test('no schedule and nothing running is simply idle with nothing to count toward', () => {
  const state = computeCycleState({ now: new Date(), schedule: null, fast: null });
  assert.equal(state.phase, 'idle');
  assert.equal(state.nextTransition, null);
});

test('a single long fast has no eating window and stays open past its goal instead of flipping phase', () => {
  inZone('Europe/Berlin', () => {
    const single: FastingSchedule = { fastingHours: 24, eatingHours: 0, startMinutes: 8 * 60 };
    const fast = { start: at(2026, 9, 28, 8), end: new Date(at(2026, 9, 28, 8).getTime() + 24 * HOUR), eatingHours: 0 };

    const during = computeCycleState({ now: at(2026, 9, 28, 20), schedule: single, fast });
    assert.equal(during.phase, 'fasting');
    assert.equal(during.eatingStart, null);
    assert.equal(during.nextTransition!.kind, 'goal_reached');

    const after = computeCycleState({ now: at(2026, 9, 29, 10), schedule: single, fast });
    assert.equal(after.phase, 'fasting');
    assert.equal(after.goalReached, true);
    assert.ok(after.remainingMs < 0);
    assert.equal(after.nextTransition, null);
  });
});

test('day-by-day framing is reserved for fasts longer than a day', () => {
  assert.equal(isMultiDayFast(14), false);
  assert.equal(isMultiDayFast(16), false);
  assert.equal(isMultiDayFast(24), false);
  assert.equal(isMultiDayFast(36), true);
  assert.equal(isMultiDayFast(72), true);
});

test('clock times stay put on the spring-forward day: fasting 20:00 to 12:00 is 15 real hours, not 16', () => {
  inZone('Europe/Berlin', () => {
    const occurrence = occurrenceStartingOn(sixteenEight, at(2026, 3, 28));
    assert.equal(clock(occurrence.start), '20:00');
    assert.equal(clock(occurrence.fastEnd), '12:00');
    assert.equal(occurrence.fastEnd.getTime() - occurrence.start.getTime(), 15 * HOUR);
    assert.equal(clock(nextOccurrenceAfter(sixteenEight, occurrence.fastEnd).start), '20:00');
  });
});

test('clock times stay put on the fall-back day: fasting 20:00 to 12:00 is 17 real hours', () => {
  inZone('Europe/Berlin', () => {
    const occurrence = occurrenceStartingOn(sixteenEight, at(2026, 10, 24));
    assert.equal(clock(occurrence.start), '20:00');
    assert.equal(clock(occurrence.fastEnd), '12:00');
    assert.equal(occurrence.fastEnd.getTime() - occurrence.start.getTime(), 17 * HOUR);
  });
});

test('the same schedule reads the same wall-clock times in a zone that has no daylight saving', () => {
  inZone('Asia/Kolkata', () => {
    const occurrence = occurrenceStartingOn(sixteenEight, at(2026, 3, 28));
    assert.equal(occurrence.fastEnd.getTime() - occurrence.start.getTime(), 16 * HOUR);
  });
});

test('wall-clock hour addition and calendar-day differences are DST-safe', () => {
  inZone('Europe/Berlin', () => {
    assert.equal(clock(addWallClockHours(at(2026, 3, 28, 20), 16)), '12:00');
    assert.equal(calendarDayDifference(at(2026, 3, 29, 12), at(2026, 3, 28, 20)), 1);
    assert.equal(calendarDayDifference(at(2026, 3, 28, 1), at(2026, 3, 28, 23)), 0);
    assert.equal(calendarDayDifference(at(2026, 3, 27, 23), at(2026, 3, 28, 1)), -1);
  });
});

// ---- Editing a schedule while a fast is running -------------------------------------------

const running = { start: at(2026, 9, 28, 20), end: at(2026, 9, 29, 12), extensionCount: 0 };

test('with nothing running an edit simply applies from the next start', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 28, 14), current: null, next: { ...sixteenEight, startMinutes: 19 * 60 } });
    assert.equal(plan.canApplyToCurrent, false);
    assert.equal(plan.blockedBecause, 'no_fast_in_progress');
    assert.equal(plan.nextFastStart!.getTime(), at(2026, 9, 28, 19).getTime());
  });
});

test('mid-fast: a start time already reached can be applied to the current fast, and the next cycle follows the edit', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 28, 22), current: running, next: { ...sixteenEight, startMinutes: 21 * 60 } });
    assert.equal(plan.canApplyToCurrent, true);
    assert.equal(plan.blockedBecause, null);
    assert.equal(plan.currentIfApplied!.start.getTime(), at(2026, 9, 28, 21).getTime());
    assert.equal(plan.currentIfApplied!.fastEnd.getTime(), at(2026, 9, 29, 13).getTime());
    assert.equal(plan.nextFastStart!.getTime(), at(2026, 9, 29, 21).getTime());
  });
});

test('mid-fast: a start time that has not happened yet cannot rewrite the current fast - it applies to the next cycle only', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 28, 22), current: running, next: { ...sixteenEight, startMinutes: 23 * 60 } });
    assert.equal(plan.canApplyToCurrent, false);
    assert.equal(plan.blockedBecause, 'would_start_in_future');
    assert.equal(plan.nextFastStart!.getTime(), at(2026, 9, 29, 23).getTime());
  });
});

test('mid-fast: a model change that would already have ended the fast is refused for the current one', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 29, 11), current: running, next: { fastingHours: 14, eatingHours: 10, startMinutes: 20 * 60 } });
    assert.equal(plan.canApplyToCurrent, false);
    assert.equal(plan.blockedBecause, 'would_already_be_over');
  });
});

test('mid-fast: a longer model can be applied to the current fast while its window is still open', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 28, 22), current: running, next: { fastingHours: 18, eatingHours: 6, startMinutes: 20 * 60 } });
    assert.equal(plan.canApplyToCurrent, true);
    assert.equal(plan.currentIfApplied!.fastEnd.getTime(), at(2026, 9, 29, 14).getTime());
  });
});

test('an extended fast is never silently re-planned by an edit', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 28, 22), current: { ...running, extensionCount: 1 }, next: { ...sixteenEight, startMinutes: 21 * 60 } });
    assert.equal(plan.canApplyToCurrent, false);
    assert.equal(plan.blockedBecause, 'extended');
  });
});

test('editing across midnight matches the window the fast really belongs to', () => {
  inZone('Europe/Berlin', () => {
    const plan = planScheduleEdit({ now: at(2026, 9, 29, 1), current: running, next: { ...sixteenEight, startMinutes: 19 * 60 } });
    assert.equal(plan.canApplyToCurrent, true);
    assert.equal(plan.currentIfApplied!.start.getTime(), at(2026, 9, 28, 19).getTime());
    assert.equal(plan.currentIfApplied!.fastEnd.getTime(), at(2026, 9, 29, 11).getTime());
  });
});

// ---- Timeline -----------------------------------------------------------------------------

import { TIMELINE_PHASES, limitTimelinePhases } from '../src/features/fasting/fastingTimelineContent';

test('the timeline of a 16-hour fast stops at 16 hours - nothing about day two or three', () => {
  const phases = limitTimelinePhases(TIMELINE_PHASES, 16);
  const hours = phases.flatMap((phase) => phase.milestones.map((milestone) => milestone.hours));
  assert.ok(hours.length > 0);
  assert.ok(Math.max(...hours) <= 16);
  assert.ok(phases.length < TIMELINE_PHASES.length, 'later phases are dropped entirely');
});

test('a three-day fast keeps the whole timeline', () => {
  const phases = limitTimelinePhases(TIMELINE_PHASES, 72);
  assert.deepEqual(
    phases.flatMap((phase) => phase.milestones.map((milestone) => milestone.hours)),
    TIMELINE_PHASES.flatMap((phase) => phase.milestones.map((milestone) => milestone.hours)).filter((h) => h <= 72)
  );
});
