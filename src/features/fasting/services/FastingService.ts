import { FastingRepository } from '../repository/FastingRepository';
import { FastingMethodId, FastingPlan, FastingSession, FASTING_METHODS, LONGER_FASTING_THRESHOLD_HOURS } from '../models';
import { FastingSchedule, getLocalTimeZone, isDailyCycle, planScheduleEdit, resolveStart, validateSchedule } from './FastingSchedule';
import { categoryForMethod, planFieldsForSchedule } from './fastingPlanSchedule';

export interface ScheduleRequest {
  methodId: FastingMethodId;
  schedule: FastingSchedule;
}

/**
 * Use-case layer: orchestrates repository calls + business rules.
 * Redux thunks call into this service; the service never imports React
 * Native or Redux, so it stays unit-testable in isolation.
 */
export class FastingService {
  constructor(private repository: FastingRepository) {}

  /**
   * A daily-cycle fast is settled at its planned end - the fast reached its
   * goal at that instant, whether or not the app was open - so it moves into
   * history and the eating window that follows is derived from the schedule.
   * A single long fast is left running past its goal until the user ends it.
   */
  async reconcile(userId: string, now: Date = new Date()): Promise<void> {
    const active = await this.repository.getActiveFast(userId);
    if (active && (active.eatingHours ?? 0) > 0 && now.getTime() >= new Date(active.plannedEndTimestamp).getTime()) {
      await this.repository.completeFast(active.id, active.plannedEndTimestamp);
    }
  }

  async getActiveFast(userId: string) {
    await this.reconcile(userId);
    return this.repository.getActiveFast(userId);
  }

  async getHistory(userId: string) {
    return this.repository.getHistory(userId);
  }

  /** The one schedule the timer follows: the user's active plan, if any. */
  async getActivePlan(userId: string): Promise<FastingPlan | null> {
    const plans = await this.repository.getPlans(userId);
    return plans.find((plan) => plan.active) ?? null;
  }

  /**
   * Starts fasting on a schedule. A daily model also becomes the user's saved
   * schedule; a single long fast does not replace it. The fast begins at the
   * schedule's own start (so "fasting begins 20:00" is what is recorded) when
   * that window is already open; otherwise only the schedule is saved and the
   * next window is shown as upcoming. A fast that is already running is never
   * duplicated or altered here.
   */
  async startFast(userId: string, request: ScheduleRequest, now: Date = new Date()): Promise<{ session: FastingSession | null; alreadyActive: boolean; plan: FastingPlan | null }> {
    const invalid = validateSchedule(request.schedule);
    if (invalid) throw new Error(`Invalid fasting schedule: ${invalid}`);
    if (!FASTING_METHODS.some((m) => m.id === request.methodId)) throw new Error(`Unknown fasting method: ${request.methodId}`);

    const existing = await this.repository.getActiveFast(userId);
    if (existing) return { session: existing, alreadyActive: true, plan: await this.getActivePlan(userId) };

    const daily = isDailyCycle(request.schedule);
    const plan = daily ? await this.upsertActivePlan(userId, request, now) : await this.getActivePlan(userId);

    const resolution = resolveStart(request.schedule, now);
    if (daily && resolution.kind === 'upcoming') return { session: null, alreadyActive: false, plan };

    const { session, alreadyActive } = await this.repository.startFast({
      userId,
      method: request.methodId,
      category: categoryForMethod(request.methodId),
      startTimestamp: resolution.occurrence.start.toISOString(),
      plannedEndTimestamp: resolution.occurrence.fastEnd.toISOString(),
      fastingPlanId: daily ? plan?.id ?? null : null,
      eatingHours: request.schedule.eatingHours,
    });
    return { session, alreadyActive, plan };
  }

  /**
   * Edits the saved schedule. By default a fast already running keeps its
   * window and the change applies from the next cycle; `applyToCurrent` also
   * re-plans the running fast, but only where `planScheduleEdit` says that is
   * coherent - otherwise this refuses rather than quietly doing something else.
   */
  async saveSchedule(
    userId: string,
    request: ScheduleRequest,
    options: { applyToCurrent: boolean },
    now: Date = new Date()
  ): Promise<{ plan: FastingPlan | null; session: FastingSession | null }> {
    const invalid = validateSchedule(request.schedule);
    if (invalid) throw new Error(`Invalid fasting schedule: ${invalid}`);

    const active = await this.repository.getActiveFast(userId);
    let session = active;
    if (active && options.applyToCurrent) {
      const edit = planScheduleEdit({
        now,
        current: { start: new Date(active.startTimestamp), end: new Date(active.plannedEndTimestamp), extensionCount: active.extensionCount },
        next: request.schedule,
      });
      if (!edit.canApplyToCurrent || !edit.currentIfApplied) throw new Error(`The current fast cannot take this change: ${edit.blockedBecause}`);
      session = await this.repository.rescheduleFast(active.id, {
        startTimestamp: edit.currentIfApplied.start.toISOString(),
        plannedEndTimestamp: edit.currentIfApplied.fastEnd.toISOString(),
        method: request.methodId,
        category: categoryForMethod(request.methodId),
        eatingHours: request.schedule.eatingHours,
      });
    }

    const plan = isDailyCycle(request.schedule) ? await this.upsertActivePlan(userId, request, now) : await this.getActivePlan(userId);
    return { plan, session };
  }

  private async upsertActivePlan(userId: string, request: ScheduleRequest, now: Date): Promise<FastingPlan> {
    const current = await this.getActivePlan(userId);
    const fields = planFieldsForSchedule(request.methodId, request.schedule);
    const plan: FastingPlan = current
      ? { ...current, ...fields, timezone: getLocalTimeZone(), active: true }
      : {
          id: `plan_${now.getTime().toString(36)}`,
          userId,
          recurring: true,
          weekdays: [0, 1, 2, 3, 4, 5, 6],
          startDate: now.toISOString(),
          timezone: getLocalTimeZone(),
          active: true,
          notificationSettings: { fastingBegins: true, fastingEnds: true, eatingPhaseBegins: true },
          ...fields,
        };
    return this.repository.savePlan(plan);
  }

  async endFastNow(session: FastingSession): Promise<FastingSession> {
    const isOnOrAfterPlannedEnd = Date.now() >= new Date(session.plannedEndTimestamp).getTime();
    if (!isOnOrAfterPlannedEnd) return this.repository.endFastPrematurely(session.id);
    // A daily-cycle fast ends when its goal was reached - hours spent in the eating window that followed are not fasting time.
    return (session.eatingHours ?? 0) > 0 ? this.repository.completeFast(session.id, session.plannedEndTimestamp) : this.repository.completeFast(session.id);
  }

  async extendFast(sessionId: string, additionalHours: number, currentPlannedEnd: string): Promise<FastingSession> {
    const newEnd = new Date(new Date(currentPlannedEnd).getTime() + additionalHours * 60 * 60 * 1000);
    return this.repository.extendFast(sessionId, newEnd.toISOString());
  }

  async cancelFast(sessionId: string): Promise<FastingSession> {
    return this.repository.cancelFast(sessionId);
  }

  requiresSafetyNotice(methodId: FastingMethodId): boolean {
    const method = FASTING_METHODS.find((m) => m.id === methodId);
    return !!method && method.fastingHours >= LONGER_FASTING_THRESHOLD_HOURS;
  }
}
