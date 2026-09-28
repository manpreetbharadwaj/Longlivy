import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { FastingSession } from '../models';
import { loadFastingData } from '../fastingSlice';
import { selectActiveFast, selectActiveSchedule, selectFastingPlan, selectLastCompletedFast } from '../selectors';
import { CycleState, FastWindow, FastingSchedule, computeCycleState } from '../services/FastingSchedule';

export function toFastWindow(session: FastingSession): FastWindow {
  return { start: new Date(session.startTimestamp), end: new Date(session.plannedEndTimestamp), eatingHours: session.eatingHours ?? 0 };
}

export interface FastingCycle {
  state: CycleState;
  schedule: FastingSchedule | null;
  activeFast: FastingSession | null;
  now: Date;
}

/**
 * The live cycle the timer screens render: which phase the user is in and
 * what comes next, derived from the running fast, the saved schedule and the
 * current local time - recomputed every second and never stored.
 *
 * With `settle`, the hook also re-reads fasting data at the moment a daily
 * fast reaches its planned end, so the finished fast moves into history and the
 * eating window carries on from there without the user having to do anything.
 */
export function useFastingCycle(options: { settle?: boolean } = {}): FastingCycle {
  const dispatch = useAppDispatch();
  const activeFast = useAppSelector(selectActiveFast);
  const schedule = useAppSelector(selectActiveSchedule);
  const plan = useAppSelector(selectFastingPlan);
  const lastCompleted = useAppSelector(selectLastCompletedFast);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const state = useMemo(
    () => computeCycleState({ now, schedule, fast: activeFast ? toFastWindow(activeFast) : null, lastFast: lastCompleted ? toFastWindow(lastCompleted) : null }),
    // `plan` is read so a schedule edit recomputes even if the derived schedule object is structurally equal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now, schedule, plan, activeFast, lastCompleted]
  );

  const settledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!options.settle || !activeFast || (activeFast.eatingHours ?? 0) <= 0) return;
    if (now.getTime() < new Date(activeFast.plannedEndTimestamp).getTime()) return;
    const key = `${activeFast.id}:${activeFast.plannedEndTimestamp}`;
    if (settledFor.current === key) return;
    settledFor.current = key;
    dispatch(loadFastingData());
  }, [options.settle, activeFast, now, dispatch]);

  return { state, schedule, activeFast, now };
}
