import { FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';

/**
 * Repository interface. UI/Redux never talk to a concrete implementation
 * directly — only through this contract. Swap MockFastingRepository for an
 * ApiFastingRepository later without touching screens or slices.
 */
export interface FastingRepository {
  getActiveFast(userId: string): Promise<FastingSession | null>;
  getHistory(userId: string): Promise<FastingSession[]>;
  getSession(id: string): Promise<FastingSession | null>;
  /**
   * Creates a new active session — but only if the user doesn't already have
   * one. Implementations must perform the "is one already active?" check and
   * the write as a single atomic step (not a separate read followed by a
   * separate write), so two calls racing each other can never both create a
   * session. When one is already active, `alreadyActive` is `true` and
   * `session` is the *existing* session — no new one is created.
   */
  startFast(input: {
    userId: string;
    method: FastingSession['method'];
    category: FastingSession['category'];
    startTimestamp: string;
    plannedEndTimestamp: string;
    fastingPlanId?: string | null;
    eatingHours?: number;
  }): Promise<{ session: FastingSession; alreadyActive: boolean }>;
  endFastPrematurely(id: string): Promise<FastingSession>;
  /** `endedAt` (ISO) records the fast as having ended at that instant rather than now - used to settle a daily-cycle fast at its planned end even when nobody opened the app until later. */
  completeFast(id: string, endedAt?: string): Promise<FastingSession>;
  /** Re-plans a fast that is still open (start, planned end, model) and clears any extension - the "apply my edit to the current fast" path. */
  rescheduleFast(
    id: string,
    changes: { startTimestamp: string; plannedEndTimestamp: string; method: FastingSession['method']; category: FastingSession['category']; eatingHours: number }
  ): Promise<FastingSession>;
  extendFast(id: string, newPlannedEndTimestamp: string): Promise<FastingSession>;
  cancelFast(id: string): Promise<FastingSession>;
  getPlans(userId: string): Promise<FastingPlan[]>;
  /** Saves a plan; a plan saved as `active` becomes the only active one. */
  savePlan(plan: FastingPlan): Promise<FastingPlan>;
  getPlanOverrides(planId: string): Promise<FastingPlanDayOverride[]>;
  setPlanDayOverride(input: Omit<FastingPlanDayOverride, 'id' | 'createdAt'>): Promise<FastingPlanDayOverride>;
  removePlanDayOverride(planId: string, date: string): Promise<void>;
}
